/**
 * Kids AI Studio — storage layer.
 *
 * Follows the same lazy, additive DDL pattern as aiforkids.ts and
 * newsletter.ts: tables are created on first use with CREATE TABLE IF NOT
 * EXISTS. Nothing here ever drops or alters an existing table.
 *
 * PRIVACY: child rows are pseudonymous by construction. A child is a
 * nickname, an avatar id and a PIN hash inside a class. There is no column
 * for a legal name, email, birth date, photo or address, and none may be
 * added. Consent is a boolean plus the date and the facilitator who recorded
 * it; the signed form itself lives outside this system.
 */
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type ModeId = "game" | "story" | "prompt" | "quest" | "video" | "robot" | "homework";
export const ALL_MODES: ModeId[] = ["game", "story", "prompt", "quest", "video", "robot", "homework"];

export type Facilitator = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

export type ClassRow = {
  id: number;
  facilitator_id: number;
  name: string;
  code: string;
  modes: string; // comma-separated ModeId list
  ticket_limit: number;
  chat_turn_limit: number;
  paused: boolean;
  locked: boolean;
  sound_enabled: boolean;
  session_started_at: string;
  created_at: string;
};

export type ChildRow = {
  id: number;
  class_id: number;
  nickname: string;
  avatar: string;
  pin_hash: string;
  consent_recorded: boolean;
  consent_recorded_at: string | null;
  consent_recorded_by: number | null;
  muted: boolean;
  pin_attempts: number;
  pin_locked: boolean;
  created_at: string;
};

export type RequestStatus = "queued" | "working" | "done" | "blocked" | "failed";

export type RequestRow = {
  id: number;
  class_id: number;
  child_id: number | null; // null = facilitator projector mode
  mode: ModeId;
  kind: "create" | "change" | "chat";
  project_artifact_id: number | null;
  input: any;
  status: RequestStatus;
  message: string | null; // kid-facing message (blocked / failed reason)
  flags: any; // array of {layer, category, detail}
  result_artifact_id: number | null;
  created_at: string;
  completed_at: string | null;
};

export type ArtifactKind = "game" | "story" | "image" | "quest" | "video" | "robot" | "chat" | "audio";

export type ArtifactRow = {
  id: number;
  class_id: number;
  child_id: number | null;
  kind: ArtifactKind;
  title: string;
  content: string; // HTML for games, markdown/text for stories, base64 for images
  mime: string;
  summary: string | null;
  approved: boolean; // images only: facilitator approval gate
  published: boolean; // visible in class Arcade
  version: number;
  parent_artifact_id: number | null;
  created_at: string;
};

/* ------------------------------------------------------------------ *
 * DDL
 * ------------------------------------------------------------------ */

let ready: Promise<void> | null = null;

export function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_facilitators (
          id serial PRIMARY KEY,
          email text NOT NULL UNIQUE,
          password_hash text NOT NULL,
          display_name text NOT NULL,
          is_admin boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_classes (
          id serial PRIMARY KEY,
          facilitator_id integer NOT NULL REFERENCES aik_facilitators(id),
          name text NOT NULL,
          code text NOT NULL UNIQUE,
          modes text NOT NULL DEFAULT '',
          ticket_limit integer NOT NULL DEFAULT 2,
          paused boolean NOT NULL DEFAULT false,
          locked boolean NOT NULL DEFAULT false,
          sound_enabled boolean NOT NULL DEFAULT false,
          session_started_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(sql`
        ALTER TABLE aik_classes ADD COLUMN IF NOT EXISTS chat_turn_limit integer NOT NULL DEFAULT 15`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_children (
          id serial PRIMARY KEY,
          class_id integer NOT NULL REFERENCES aik_classes(id) ON DELETE CASCADE,
          nickname text NOT NULL,
          avatar text NOT NULL,
          pin_hash text NOT NULL,
          consent_recorded boolean NOT NULL DEFAULT false,
          consent_recorded_at timestamptz,
          consent_recorded_by integer,
          muted boolean NOT NULL DEFAULT false,
          pin_attempts integer NOT NULL DEFAULT 0,
          pin_locked boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (class_id, nickname)
        )`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_artifacts (
          id serial PRIMARY KEY,
          class_id integer NOT NULL REFERENCES aik_classes(id) ON DELETE CASCADE,
          child_id integer REFERENCES aik_children(id) ON DELETE CASCADE,
          kind text NOT NULL,
          title text NOT NULL,
          content text NOT NULL,
          mime text NOT NULL,
          summary text,
          approved boolean NOT NULL DEFAULT true,
          published boolean NOT NULL DEFAULT false,
          version integer NOT NULL DEFAULT 1,
          parent_artifact_id integer,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_requests (
          id serial PRIMARY KEY,
          class_id integer NOT NULL REFERENCES aik_classes(id) ON DELETE CASCADE,
          child_id integer REFERENCES aik_children(id) ON DELETE CASCADE,
          mode text NOT NULL,
          kind text NOT NULL,
          project_artifact_id integer,
          input jsonb NOT NULL,
          status text NOT NULL DEFAULT 'queued',
          message text,
          flags jsonb NOT NULL DEFAULT '[]'::jsonb,
          result_artifact_id integer,
          created_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz
        )`);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS aik_requests_class_idx ON aik_requests (class_id, id)`);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS aik_requests_child_idx ON aik_requests (child_id, created_at)`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aik_audit (
          id serial PRIMARY KEY,
          class_id integer,
          actor_type text NOT NULL,
          actor_id integer,
          action text NOT NULL,
          detail jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS aik_audit_class_idx ON aik_audit (class_id, id)`);
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

function rows<T>(result: any): T[] {
  return (result?.rows ?? result ?? []) as T[];
}
function one<T>(result: any): T | null {
  const r = rows<T>(result);
  return r.length ? r[0] : null;
}

/* ------------------------------------------------------------------ *
 * Codes and hashing (PINs use the same scrypt scheme as site passwords)
 * ------------------------------------------------------------------ */

export function newClassCode(): string {
  // 6 chars, no ambiguous glyphs, easy to read off a projector.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function normalizeCode(code: string): string {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 6);
}

/* ------------------------------------------------------------------ *
 * Facilitators
 * ------------------------------------------------------------------ */

export async function countFacilitators(): Promise<number> {
  await ensureTables();
  const r = one<{ n: string }>(await db.execute(sql`SELECT count(*)::text AS n FROM aik_facilitators`));
  return Number(r?.n ?? 0);
}

export async function createFacilitator(email: string, passwordHash: string, displayName: string, isAdmin: boolean): Promise<Facilitator> {
  await ensureTables();
  const r = one<Facilitator>(
    await db.execute(sql`
      INSERT INTO aik_facilitators (email, password_hash, display_name, is_admin)
      VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${displayName}, ${isAdmin})
      RETURNING *`),
  );
  return r!;
}

export async function getFacilitatorByEmail(email: string): Promise<Facilitator | null> {
  await ensureTables();
  return one<Facilitator>(await db.execute(sql`SELECT * FROM aik_facilitators WHERE email = ${email.toLowerCase().trim()} LIMIT 1`));
}

export async function getFacilitator(id: number): Promise<Facilitator | null> {
  await ensureTables();
  return one<Facilitator>(await db.execute(sql`SELECT * FROM aik_facilitators WHERE id = ${id} LIMIT 1`));
}

export async function updateFacilitatorPassword(id: number, passwordHash: string): Promise<void> {
  await ensureTables();
  await db.execute(sql`UPDATE aik_facilitators SET password_hash = ${passwordHash} WHERE id = ${id}`);
}

/* ------------------------------------------------------------------ *
 * Classes
 * ------------------------------------------------------------------ */

export async function createClass(facilitatorId: number, name: string, ticketLimit: number): Promise<ClassRow> {
  await ensureTables();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newClassCode();
    try {
      const r = one<ClassRow>(
        await db.execute(sql`
          INSERT INTO aik_classes (facilitator_id, name, code, ticket_limit)
          VALUES (${facilitatorId}, ${name}, ${code}, ${ticketLimit})
          RETURNING *`),
      );
      return r!;
    } catch (err: any) {
      if (!String(err?.message).includes("unique")) throw err;
    }
  }
  throw new Error("Could not allocate a unique class code");
}

export async function listClasses(facilitatorId: number, isAdmin: boolean): Promise<ClassRow[]> {
  await ensureTables();
  if (isAdmin) return rows<ClassRow>(await db.execute(sql`SELECT * FROM aik_classes ORDER BY created_at DESC`));
  return rows<ClassRow>(await db.execute(sql`SELECT * FROM aik_classes WHERE facilitator_id = ${facilitatorId} ORDER BY created_at DESC`));
}

export async function getClass(id: number): Promise<ClassRow | null> {
  await ensureTables();
  return one<ClassRow>(await db.execute(sql`SELECT * FROM aik_classes WHERE id = ${id} LIMIT 1`));
}

export async function getClassByCode(code: string): Promise<ClassRow | null> {
  await ensureTables();
  return one<ClassRow>(await db.execute(sql`SELECT * FROM aik_classes WHERE code = ${normalizeCode(code)} LIMIT 1`));
}

export async function updateClass(
  id: number,
  patch: Partial<Pick<ClassRow, "name" | "modes" | "ticket_limit" | "chat_turn_limit" | "paused" | "locked" | "sound_enabled">>,
): Promise<ClassRow | null> {
  await ensureTables();
  const current = await getClass(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  return one<ClassRow>(
    await db.execute(sql`
      UPDATE aik_classes SET
        name = ${next.name},
        modes = ${next.modes},
        ticket_limit = ${next.ticket_limit},
        chat_turn_limit = ${next.chat_turn_limit},
        paused = ${next.paused},
        locked = ${next.locked},
        sound_enabled = ${next.sound_enabled}
      WHERE id = ${id}
      RETURNING *`),
  );
}

export async function rotateClassCode(id: number): Promise<ClassRow | null> {
  await ensureTables();
  return one<ClassRow>(await db.execute(sql`UPDATE aik_classes SET code = ${newClassCode()} WHERE id = ${id} RETURNING *`));
}

export async function startNewSession(id: number): Promise<ClassRow | null> {
  await ensureTables();
  return one<ClassRow>(await db.execute(sql`UPDATE aik_classes SET session_started_at = now() WHERE id = ${id} RETURNING *`));
}

/** Permanently removes a class and, via cascades, its children, requests and artifacts. */
export async function deleteClass(id: number): Promise<void> {
  await ensureTables();
  await db.execute(sql`DELETE FROM aik_classes WHERE id = ${id}`);
  await db.execute(sql`DELETE FROM aik_audit WHERE class_id = ${id}`);
}

export function parseModes(modes: string): ModeId[] {
  return modes
    .split(",")
    .map((m) => m.trim())
    .filter((m): m is ModeId => (ALL_MODES as string[]).includes(m));
}

/* ------------------------------------------------------------------ *
 * Children
 * ------------------------------------------------------------------ */

export async function listChildren(classId: number): Promise<ChildRow[]> {
  await ensureTables();
  return rows<ChildRow>(await db.execute(sql`SELECT * FROM aik_children WHERE class_id = ${classId} ORDER BY nickname`));
}

export async function getChild(id: number): Promise<ChildRow | null> {
  await ensureTables();
  return one<ChildRow>(await db.execute(sql`SELECT * FROM aik_children WHERE id = ${id} LIMIT 1`));
}

export async function createChild(classId: number, nickname: string, avatar: string, pinHash: string): Promise<ChildRow> {
  await ensureTables();
  const r = one<ChildRow>(
    await db.execute(sql`
      INSERT INTO aik_children (class_id, nickname, avatar, pin_hash)
      VALUES (${classId}, ${nickname}, ${avatar}, ${pinHash})
      RETURNING *`),
  );
  return r!;
}

export async function updateChild(
  id: number,
  patch: Partial<Pick<ChildRow, "nickname" | "avatar" | "pin_hash" | "consent_recorded" | "consent_recorded_by" | "muted" | "pin_attempts" | "pin_locked">>,
): Promise<ChildRow | null> {
  await ensureTables();
  const current = await getChild(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  const consentAt =
    patch.consent_recorded === true && !current.consent_recorded
      ? sql`now()`
      : patch.consent_recorded === false
        ? sql`NULL`
        : sql`consent_recorded_at`;
  return one<ChildRow>(
    await db.execute(sql`
      UPDATE aik_children SET
        nickname = ${next.nickname},
        avatar = ${next.avatar},
        pin_hash = ${next.pin_hash},
        consent_recorded = ${next.consent_recorded},
        consent_recorded_at = ${consentAt},
        consent_recorded_by = ${next.consent_recorded_by},
        muted = ${next.muted},
        pin_attempts = ${next.pin_attempts},
        pin_locked = ${next.pin_locked}
      WHERE id = ${id}
      RETURNING *`),
  );
}

export async function deleteChild(id: number): Promise<void> {
  await ensureTables();
  await db.execute(sql`DELETE FROM aik_children WHERE id = ${id}`);
}

/* ------------------------------------------------------------------ *
 * Requests
 * ------------------------------------------------------------------ */

export async function createRequest(input: {
  classId: number;
  childId: number | null;
  mode: ModeId;
  kind: "create" | "change" | "chat";
  projectArtifactId: number | null;
  input: any;
}): Promise<RequestRow> {
  await ensureTables();
  const r = one<RequestRow>(
    await db.execute(sql`
      INSERT INTO aik_requests (class_id, child_id, mode, kind, project_artifact_id, input)
      VALUES (${input.classId}, ${input.childId}, ${input.mode}, ${input.kind}, ${input.projectArtifactId}, ${JSON.stringify(input.input)}::jsonb)
      RETURNING *`),
  );
  return r!;
}

export async function getRequest(id: number): Promise<RequestRow | null> {
  await ensureTables();
  return one<RequestRow>(await db.execute(sql`SELECT * FROM aik_requests WHERE id = ${id} LIMIT 1`));
}

export async function finishRequest(
  id: number,
  patch: { status: RequestStatus; message?: string | null; flags?: any[]; resultArtifactId?: number | null },
): Promise<RequestRow | null> {
  await ensureTables();
  return one<RequestRow>(
    await db.execute(sql`
      UPDATE aik_requests SET
        status = ${patch.status},
        message = ${patch.message ?? null},
        flags = ${JSON.stringify(patch.flags ?? [])}::jsonb,
        result_artifact_id = ${patch.resultArtifactId ?? null},
        completed_at = CASE WHEN ${patch.status} IN ('done','blocked','failed') THEN now() ELSE completed_at END
      WHERE id = ${id}
      RETURNING *`),
  );
}

export async function markWorking(id: number): Promise<void> {
  await ensureTables();
  await db.execute(sql`UPDATE aik_requests SET status = 'working' WHERE id = ${id}`);
}

export async function countTicketsThisSession(childId: number, classId: number): Promise<number> {
  await ensureTables();
  const r = one<{ n: string }>(
    await db.execute(sql`
      SELECT count(*)::text AS n
        FROM aik_requests r
        JOIN aik_classes c ON c.id = r.class_id
       WHERE r.child_id = ${childId} AND r.class_id = ${classId}
         AND r.created_at >= c.session_started_at
         AND r.kind <> 'chat'
         AND r.status <> 'blocked'`),
  );
  return Number(r?.n ?? 0);
}

export async function countChatTurnsThisSession(childId: number, classId: number): Promise<number> {
  await ensureTables();
  const r = one<{ n: string }>(
    await db.execute(sql`
      SELECT count(*)::text AS n
        FROM aik_requests r
        JOIN aik_classes c ON c.id = r.class_id
       WHERE r.child_id = ${childId} AND r.class_id = ${classId}
         AND r.created_at >= c.session_started_at
         AND r.kind = 'chat'
         AND r.status <> 'blocked'`),
  );
  return Number(r?.n ?? 0);
}

/** The child's existing transcript for a module, if any (Projector mode: child_id IS NULL). */
export async function findChatArtifact(classId: number, childId: number | null, title: string): Promise<ArtifactRow | null> {
  await ensureTables();
  const childCond = childId === null ? sql`child_id IS NULL` : sql`child_id = ${childId}`;
  return one<ArtifactRow>(
    await db.execute(sql`SELECT * FROM aik_artifacts WHERE class_id = ${classId} AND ${childCond} AND kind = 'chat' AND title = ${title} ORDER BY id DESC LIMIT 1`),
  );
}

/** Replace the content of an artifact in place (used for chat transcripts). */
export async function updateArtifactContent(id: number, content: string, summary: string | null): Promise<void> {
  await ensureTables();
  await db.execute(sql`UPDATE aik_artifacts SET content = ${content}, summary = ${summary} WHERE id = ${id}`);
}

export async function listRequestsForClass(classId: number, afterId: number, limit = 100): Promise<RequestRow[]> {
  await ensureTables();
  return rows<RequestRow>(
    await db.execute(sql`
      SELECT * FROM aik_requests
       WHERE class_id = ${classId} AND id > ${afterId}
       ORDER BY id ASC LIMIT ${limit}`),
  );
}

export async function listRecentRequestsForClass(classId: number, limit = 60): Promise<RequestRow[]> {
  await ensureTables();
  return rows<RequestRow>(
    await db.execute(sql`
      SELECT * FROM (
        SELECT * FROM aik_requests WHERE class_id = ${classId} ORDER BY id DESC LIMIT ${limit}
      ) t ORDER BY id ASC`),
  );
}

export async function listRequestsForChild(childId: number, limit = 40): Promise<RequestRow[]> {
  await ensureTables();
  return rows<RequestRow>(
    await db.execute(sql`SELECT * FROM aik_requests WHERE child_id = ${childId} ORDER BY id DESC LIMIT ${limit}`),
  );
}

/* ------------------------------------------------------------------ *
 * Artifacts
 * ------------------------------------------------------------------ */

export async function createArtifact(input: {
  classId: number;
  childId: number | null;
  kind: ArtifactKind;
  title: string;
  content: string;
  mime: string;
  summary: string | null;
  approved: boolean;
  parentArtifactId: number | null;
}): Promise<ArtifactRow> {
  await ensureTables();
  let version = 1;
  if (input.parentArtifactId) {
    const parent = await getArtifact(input.parentArtifactId);
    if (parent) version = parent.version + 1;
  }
  const r = one<ArtifactRow>(
    await db.execute(sql`
      INSERT INTO aik_artifacts (class_id, child_id, kind, title, content, mime, summary, approved, version, parent_artifact_id)
      VALUES (${input.classId}, ${input.childId}, ${input.kind}, ${input.title}, ${input.content}, ${input.mime},
              ${input.summary}, ${input.approved}, ${version}, ${input.parentArtifactId})
      RETURNING *`),
  );
  return r!;
}

export async function getArtifact(id: number): Promise<ArtifactRow | null> {
  await ensureTables();
  return one<ArtifactRow>(await db.execute(sql`SELECT * FROM aik_artifacts WHERE id = ${id} LIMIT 1`));
}

/** Portfolio: latest version of each project chain for a child. */
export async function listPortfolio(childId: number): Promise<Omit<ArtifactRow, "content">[]> {
  await ensureTables();
  return rows<Omit<ArtifactRow, "content">>(
    await db.execute(sql`
      SELECT a.id, a.class_id, a.child_id, a.kind, a.title, a.mime, a.summary, a.approved, a.published, a.version, a.parent_artifact_id, a.created_at
        FROM aik_artifacts a
       WHERE a.child_id = ${childId}
         AND NOT EXISTS (SELECT 1 FROM aik_artifacts b WHERE b.parent_artifact_id = a.id)
       ORDER BY a.created_at DESC`),
  );
}

export async function listArcade(classId: number): Promise<(Omit<ArtifactRow, "content"> & { nickname: string | null; avatar: string | null })[]> {
  await ensureTables();
  return rows(
    await db.execute(sql`
      SELECT a.id, a.class_id, a.child_id, a.kind, a.title, a.mime, a.summary, a.approved, a.published, a.version, a.parent_artifact_id, a.created_at,
             c.nickname, c.avatar
        FROM aik_artifacts a
        LEFT JOIN aik_children c ON c.id = a.child_id
       WHERE a.class_id = ${classId} AND a.published = true AND a.approved = true
       ORDER BY a.created_at DESC`),
  );
}

export async function setArtifactPublished(id: number, published: boolean): Promise<void> {
  await ensureTables();
  await db.execute(sql`UPDATE aik_artifacts SET published = ${published} WHERE id = ${id}`);
}

export async function setArtifactApproved(id: number, approved: boolean): Promise<void> {
  await ensureTables();
  await db.execute(sql`UPDATE aik_artifacts SET approved = ${approved} WHERE id = ${id}`);
}

export async function listPendingApprovals(classId: number): Promise<Omit<ArtifactRow, "content">[]> {
  await ensureTables();
  return rows(
    await db.execute(sql`
      SELECT id, class_id, child_id, kind, title, mime, summary, approved, published, version, parent_artifact_id, created_at
        FROM aik_artifacts WHERE class_id = ${classId} AND approved = false ORDER BY created_at ASC`),
  );
}

/* ------------------------------------------------------------------ *
 * Audit
 * ------------------------------------------------------------------ */

export async function audit(
  classId: number | null,
  actorType: "facilitator" | "child" | "system",
  actorId: number | null,
  action: string,
  detail?: any,
): Promise<void> {
  await ensureTables();
  await db.execute(sql`
    INSERT INTO aik_audit (class_id, actor_type, actor_id, action, detail)
    VALUES (${classId}, ${actorType}, ${actorId}, ${action}, ${detail === undefined ? null : JSON.stringify(detail)}::jsonb)`);
}

export async function exportClass(classId: number): Promise<any> {
  await ensureTables();
  const klass = await getClass(classId);
  const children = (await listChildren(classId)).map(({ pin_hash, ...c }) => c);
  const requests = rows<RequestRow>(await db.execute(sql`SELECT * FROM aik_requests WHERE class_id = ${classId} ORDER BY id`));
  const artifacts = rows<ArtifactRow>(await db.execute(sql`SELECT * FROM aik_artifacts WHERE class_id = ${classId} ORDER BY id`));
  const auditRows = rows(await db.execute(sql`SELECT * FROM aik_audit WHERE class_id = ${classId} ORDER BY id`));
  return { exportedAt: new Date().toISOString(), class: klass, children, requests, artifacts, audit: auditRows };
}
