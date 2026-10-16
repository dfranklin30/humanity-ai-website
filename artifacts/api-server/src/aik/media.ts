/**
 * Kids AI Studio — where generated pictures, songs and movies live.
 *
 * Until now every image, clip and song was a base64 string in the artifact
 * row. That was the simplest thing that worked for one picture per child; a
 * storybook is eight pictures and six narration clips, and a movie is tens of
 * megabytes. Postgres is the wrong place for that, and every portfolio list
 * that touched the row paid for it.
 *
 * So media now goes to a private Azure Blob container and the artifact keeps a
 * reference: `aik://<requestId>/<name>`. Nothing in that container is public.
 * The only way to a child's picture is `/api/aik/artifacts/:id/media/:name`,
 * which runs the same ownership check as the artifact itself and only serves
 * names the artifact actually references.
 *
 * With no storage account configured (local work, the mock), media stays
 * inline as a data: URI, so every reader has to accept both shapes. That is
 * what `mediaSrc` on the browser side and `resolveMedia` here are for.
 */
import { aikConfig, isMediaStoreConfigured } from "./config";
import { logger } from "../lib/logger";

export type MediaRef = string; // "aik://r123/cover.png" or "data:image/png;base64,..."

const PREFIX = "aik://";

export function isStoredRef(ref: string): boolean {
  return ref.startsWith(PREFIX);
}

/** The blob name behind a stored reference. */
export function blobNameOf(ref: string): string | null {
  if (!isStoredRef(ref)) return null;
  const name = ref.slice(PREFIX.length);
  // Only our own shape, so a reference can never reach outside the container.
  return /^r\d+\/[a-z0-9_-]+\.[a-z0-9]+$/i.test(name) ? name : null;
}

type Container = import("@azure/storage-blob").ContainerClient;
let container: Promise<Container> | null = null;

async function getContainer(): Promise<Container> {
  if (!container) {
    container = (async () => {
      const { BlobServiceClient } = await import("@azure/storage-blob");
      const m = aikConfig.media;
      let service;
      if (m.connectionString) {
        service = BlobServiceClient.fromConnectionString(m.connectionString);
      } else {
        const { DefaultAzureCredential } = await import("@azure/identity");
        service = new BlobServiceClient(`https://${m.account}.blob.core.windows.net`, new DefaultAzureCredential());
      }
      const c = service.getContainerClient(m.container);
      // Private by default: no public access level is ever set here.
      await c.createIfNotExists();
      return c;
    })();
    container.catch(() => {
      container = null;
    });
  }
  return container;
}

/**
 * Store a piece of media for a request and return the reference to keep in
 * the artifact. Falls back to inline data when there is no store.
 */
export async function putMedia(requestId: number, name: string, bytes: Buffer, mime: string): Promise<MediaRef> {
  if (!isMediaStoreConfigured()) return `data:${mime};base64,${bytes.toString("base64")}`;
  const blobName = `r${requestId}/${name}`;
  const c = await getContainer();
  await c.getBlockBlobClient(blobName).uploadData(bytes, { blobHTTPHeaders: { blobContentType: mime } });
  logger.info({ blobName, bytes: bytes.length, mime }, "[aik] media stored");
  return `${PREFIX}${blobName}`;
}

export type MediaBytes = { bytes: Buffer; mime: string };

/** Read media back, whichever shape the reference has. */
export async function getMedia(ref: MediaRef): Promise<MediaBytes | null> {
  const inline = /^data:([^;,]+);base64,(.+)$/s.exec(ref);
  if (inline) return { bytes: Buffer.from(inline[2], "base64"), mime: inline[1] };
  const blobName = blobNameOf(ref);
  if (!blobName || !isMediaStoreConfigured()) return null;
  const c = await getContainer();
  const blob = c.getBlockBlobClient(blobName);
  const res = await blob.download();
  const props = res.contentType || "application/octet-stream";
  const chunks: Buffer[] = [];
  for await (const chunk of res.readableStreamBody ?? []) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return { bytes: Buffer.concat(chunks), mime: props };
}

/** Best-effort cleanup for a request whose artifact was never created. */
export async function discardMedia(requestId: number): Promise<void> {
  if (!isMediaStoreConfigured()) return;
  try {
    const c = await getContainer();
    for await (const b of c.listBlobsFlat({ prefix: `r${requestId}/` })) await c.deleteBlob(b.name);
  } catch (err) {
    logger.warn({ err, requestId }, "[aik] media cleanup failed");
  }
}

/**
 * Every stored reference inside an artifact's content and summary. The media
 * route uses this as its allow-list: a name is served only if the artifact
 * itself points at it.
 */
export function referencedNames(...texts: (string | null | undefined)[]): Set<string> {
  const names = new Set<string>();
  const re = /aik:\/\/(r\d+\/[a-z0-9_-]+\.[a-z0-9]+)/gi;
  for (const t of texts) {
    if (!t) continue;
    for (const m of t.matchAll(re)) names.add(m[1]);
  }
  return names;
}
