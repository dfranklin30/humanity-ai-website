/**
 * Kids AI Studio — browser API client and shared types.
 * Thin fetch wrappers; all requests carry the site session cookie.
 */

export type FieldDef = { key: string; label: string; hint: string; required?: boolean; choices?: string[]; maxChars?: number };
export type ModeId = "game" | "story" | "prompt" | "quest" | "video" | "robot" | "homework";
export type ModeDef = {
  id: ModeId;
  name: string;
  emoji: string;
  tagline: string;
  blurb: string;
  artifactKind: ArtifactMeta["kind"];
  interaction: "form" | "chat" | "both";
  createFields: FieldDef[];
  changeHint: string;
  chatGreeting?: string;
  chatPlaceholder?: string;
  needsApproval: boolean;
};

export type Capability = { provider: string; ready: boolean };
export type StudioConfig = {
  enabled: boolean;
  aiReady: boolean;
  imagesReady: boolean;
  ttsReady: boolean;
  screeningReady: boolean;
  capabilities: { text: Capability; ossText: Capability; image: Capability; video: Capability; music: Capability; tts: Capability; screening: { configured: boolean; required: boolean }; mock: boolean };
  modes: ModeDef[];
  avatars: string[];
  maxFieldChars: number;
  maxChatChars: number;
};

export type Flag = { layer: string; category: string; detail?: string; severity?: number };

export type StudioRequest = {
  id: number;
  classId: number;
  childId: number | null;
  mode: ModeId;
  kind: "create" | "change" | "chat";
  input: Record<string, string>;
  status: "queued" | "working" | "done" | "blocked" | "failed";
  message: string | null;
  flags?: Flag[];
  flagged?: boolean;
  resultArtifactId: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type ArtifactMeta = {
  id: number;
  classId: number;
  childId: number | null;
  kind: "game" | "story" | "image" | "quest" | "video" | "robot" | "chat" | "audio";
  title: string;
  mime: string;
  summary: string | null;
  approved: boolean;
  published: boolean;
  version: number;
  parentArtifactId: number | null;
  createdAt: string;
  nickname?: string | null;
  avatar?: string | null;
};
export type Artifact = ArtifactMeta & { content: string };

export type PublicClass = {
  id: number;
  name: string;
  code: string;
  modes: ModeId[];
  ticketLimit: number;
  chatTurnLimit: number;
  paused: boolean;
  locked: boolean;
  soundEnabled: boolean;
  sessionStartedAt: string;
  createdAt: string;
};

export type ChildSummary = {
  id: number;
  nickname: string;
  avatar: string;
  consentRecorded: boolean;
  consentRecordedAt: string | null;
  muted: boolean;
  pinLocked: boolean;
  ticketsUsed: number;
  chatTurnsUsed: number;
  createdAt: string;
};

export type Facilitator = { id: number; email: string; displayName: string; isAdmin: boolean };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/aik${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) throw new ApiError(res.status, data?.error || "Something went wrong.");
  return data as T;
}

/* Public */
export const getConfig = () => call<StudioConfig>("GET", "/config");

/* Child */
export const childLookupClass = (code: string) => call<{ className: string; children: { id: number; nickname: string; avatar: string }[] }>("POST", "/child/class", { code });
export const childLogin = (code: string, childId: number, pin: string) => call<{ ok: true }>("POST", "/child/login", { code, childId, pin });
export const childLogout = () => call<{ ok: true }>("POST", "/child/logout");
export type ChildMe = {
  child: { id: number; nickname: string; avatar: string; muted: boolean };
  class: { id: number; name: string; modes: ModeId[]; paused: boolean; locked: boolean; ticketLimit: number; chatTurnLimit: number };
  ticketsUsed: number;
  chatTurnsUsed: number;
  requests: StudioRequest[];
  portfolio: ArtifactMeta[];
  sessionExpiresAt: number;
};
export const childMe = () => call<ChildMe>("GET", "/child/me");
export const childSubmit = (body: { mode: ModeId; kind: "create" | "change" | "chat"; projectArtifactId?: number; input: Record<string, string> }) =>
  call<{ request: StudioRequest; used: number }>("POST", "/child/requests", body);
export const childSpeak = (artifactId: number) => call<{ audio: string; mime: string }>("POST", `/child/artifacts/${artifactId}/speak`);
export const childRequest = (id: number) => call<{ request: StudioRequest }>("GET", `/child/requests/${id}`);
export const childArcade = () => call<{ items: ArtifactMeta[] }>("GET", "/child/arcade");
export const childPublish = (id: number, publish: boolean) => call<{ ok: true }>("POST", `/child/artifacts/${id}/publish`, { publish });

/* Shared */
export const getArtifact = (id: number) => call<{ artifact: Artifact }>("GET", `/artifacts/${id}`);

/* Facilitator */
export const fLogin = (email: string, password: string) => call<{ facilitator: Facilitator }>("POST", "/facilitator/login", { email, password });
export const fLogout = () => call<{ ok: true }>("POST", "/facilitator/logout");
export const fMe = () => call<{ facilitator: Facilitator }>("GET", "/facilitator/me");
export const fChangePassword = (current: string, next: string) => call<{ ok: true }>("POST", "/facilitator/password", { current, next });
export const fAddFacilitator = (body: { email: string; password: string; displayName: string; isAdmin?: boolean }) => call<{ facilitator: Facilitator }>("POST", "/facilitator/facilitators", body);
export const fClasses = () => call<{ classes: PublicClass[] }>("GET", "/facilitator/classes");
export const fCreateClass = (name: string) => call<{ class: PublicClass }>("POST", "/facilitator/classes", { name });
export type ClassDetail = { class: PublicClass; children: ChildSummary[]; requests: StudioRequest[]; approvals: ArtifactMeta[] };
export const fClass = (id: number) => call<ClassDetail>("GET", `/facilitator/classes/${id}`);
export const fPatchClass = (id: number, patch: Partial<{ name: string; modes: ModeId[]; ticketLimit: number; chatTurnLimit: number; paused: boolean; locked: boolean; soundEnabled: boolean }>) =>
  call<{ class: PublicClass }>("PATCH", `/facilitator/classes/${id}`, patch);
export const fNewSession = (id: number) => call<{ class: PublicClass }>("POST", `/facilitator/classes/${id}/new-session`);
export const fRotateCode = (id: number) => call<{ class: PublicClass }>("POST", `/facilitator/classes/${id}/rotate-code`);
export const fDeleteClass = (id: number, confirmName: string) => call<{ ok: true }>("DELETE", `/facilitator/classes/${id}`, { confirmName });
export const fAddChild = (classId: number, body: { nickname: string; avatar: string; pin: string; consentRecorded?: boolean }) => call<{ child: ChildSummary }>("POST", `/facilitator/classes/${classId}/children`, body);
export const fPatchChild = (classId: number, childId: number, patch: Partial<{ nickname: string; avatar: string; pin: string; consentRecorded: boolean; muted: boolean; unlock: boolean }>) =>
  call<{ child: ChildSummary }>("PATCH", `/facilitator/classes/${classId}/children/${childId}`, patch);
export const fDeleteChild = (classId: number, childId: number) => call<{ ok: true }>("DELETE", `/facilitator/classes/${classId}/children/${childId}`);
export const fApprove = (artifactId: number, approve: boolean) => call<{ ok: true }>("POST", `/facilitator/artifacts/${artifactId}/approve`, { approve });
export const fProjector = (classId: number, body: { mode: ModeId; kind: "create" | "change" | "chat"; projectArtifactId?: number; input: Record<string, string> }) =>
  call<{ request: StudioRequest }>("POST", `/facilitator/classes/${classId}/projector`, body);
export const fRequest = (id: number) => call<{ request: StudioRequest }>("GET", `/facilitator/requests/${id}`);
export const fExportUrl = (classId: number) => `/api/aik/facilitator/classes/${classId}/export`;
export const fFeedUrl = (classId: number) => `/api/aik/facilitator/classes/${classId}/feed`;

/** Poll a child request until it settles (done/blocked/failed). */
export async function waitForRequest(id: number, getter: (id: number) => Promise<{ request: StudioRequest }>, onTick?: (r: StudioRequest) => void, timeoutMs = 120_000): Promise<StudioRequest> {
  const start = Date.now();
  let delay = 900;
  for (;;) {
    const { request } = await getter(id);
    onTick?.(request);
    if (request.status === "done" || request.status === "blocked" || request.status === "failed") return request;
    if (Date.now() - start > timeoutMs) return { ...request, status: "failed", message: "That took too long. Try again!" };
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.3, 3000);
  }
}
