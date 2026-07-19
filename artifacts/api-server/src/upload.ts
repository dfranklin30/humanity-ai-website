import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
const POST_DIR = path.join(UPLOAD_ROOT, "posts");

for (const dir of [UPLOAD_ROOT, AVATAR_DIR, POST_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/x-bmp",
  "image/tiff",
  "image/x-tiff",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "application/octet-stream",
]);

const ALLOWED_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
]);

const CONVERT_TO_JPEG_EXT = new Set([".heic", ".heif", ".tif", ".tiff", ".bmp"]);

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME.has(file.mimetype.toLowerCase());
  const extOk = ALLOWED_EXT.has(ext);
  if (!mimeOk && !extOk) {
    return cb(new Error(`Unsupported image type. Allowed: PNG, JPG, WEBP, GIF, AVIF, SVG, BMP, TIFF, HEIC, HEIF`));
  }
  cb(null, true);
}

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB (HEIC photos can be large)
});

export const postImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

export function publicUrlForUpload(kind: "avatars" | "posts", filename: string): string {
  return `/uploads/${kind}/${filename}`;
}

/**
 * Process an uploaded image buffer and save it to disk.
 * Converts HEIC/HEIF/TIFF/BMP to JPEG so all browsers can display it.
 * Keeps SVG and other web-friendly formats as-is.
 * Returns the public URL.
 */
export async function processAndSaveImage(
  file: Express.Multer.File,
  kind: "avatars" | "posts",
): Promise<string> {
  const dir = kind === "avatars" ? AVATAR_DIR : POST_DIR;
  const id = crypto.randomBytes(8).toString("hex");
  const origExt = path.extname(file.originalname).toLowerCase();

  // SVG: save as-is
  if (origExt === ".svg" || file.mimetype === "image/svg+xml") {
    const filename = `${Date.now()}-${id}.svg`;
    await fs.promises.writeFile(path.join(dir, filename), file.buffer);
    return publicUrlForUpload(kind, filename);
  }

  // Convert HEIC/HEIF/TIFF/BMP to JPEG for universal browser compatibility
  if (CONVERT_TO_JPEG_EXT.has(origExt)) {
    const filename = `${Date.now()}-${id}.jpg`;
    const out = await sharp(file.buffer, { failOn: "none" })
      .rotate() // honor EXIF orientation
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    await fs.promises.writeFile(path.join(dir, filename), out);
    return publicUrlForUpload(kind, filename);
  }

  // For everything else (png/jpg/webp/gif/avif), normalize via sharp to strip
  // bad metadata and honor orientation, but preserve the format.
  try {
    const meta = await sharp(file.buffer, { failOn: "none" }).metadata();
    const fmt = meta.format || "jpeg";
    let outBuf: Buffer;
    let ext: string;
    if (fmt === "png") {
      outBuf = await sharp(file.buffer, { failOn: "none" }).rotate().png().toBuffer();
      ext = ".png";
    } else if (fmt === "webp") {
      outBuf = await sharp(file.buffer, { failOn: "none" }).rotate().webp({ quality: 90 }).toBuffer();
      ext = ".webp";
    } else if (fmt === "gif") {
      // Preserve GIF (possibly animated) by writing the original bytes
      outBuf = file.buffer;
      ext = ".gif";
    } else if (fmt === "avif") {
      outBuf = await sharp(file.buffer, { failOn: "none" }).rotate().avif({ quality: 80 }).toBuffer();
      ext = ".avif";
    } else {
      // jpeg or unknown — encode as JPEG
      outBuf = await sharp(file.buffer, { failOn: "none" }).rotate().jpeg({ quality: 90, mozjpeg: true }).toBuffer();
      ext = ".jpg";
    }
    const filename = `${Date.now()}-${id}${ext}`;
    await fs.promises.writeFile(path.join(dir, filename), outBuf);
    return publicUrlForUpload(kind, filename);
  } catch {
    // If we can't decode it as any known image format, reject rather than
    // saving raw bytes that may not actually be an image.
    throw new Error("Could not process image — file may be corrupted or not a real image");
  }
}
