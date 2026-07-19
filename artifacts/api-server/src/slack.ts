// Slack integration (direct Slack Web API).
// Reads recent messages from the community channel for the on-site Community feed.
// Auth: a Slack bot token (SLACK_BOT_TOKEN env var) with channels:history,
// channels:read, and users:read scopes, invited to the community channel.

// Community channel (#all-humanityplusai) in the Humanity + AI Slack workspace.
export const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "C0BC09PDR9Q";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export interface CommunityMessage {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  ts: number;
}

export interface CommunityFeed {
  connected: boolean;
  channelName: string | null;
  messages: CommunityMessage[];
}

async function slackGet(path: string): Promise<any> {
  if (!SLACK_BOT_TOKEN) {
    throw new Error("SLACK_BOT_TOKEN not configured");
  }
  const res = await fetch(`https://slack.com/api${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });
  return await res.json();
}

interface CachedUser {
  name: string;
  avatar: string | null;
}

const userCache = new Map<string, CachedUser>();

async function resolveUser(uid: string): Promise<CachedUser> {
  const cached = userCache.get(uid);
  if (cached) return cached;
  let resolved: CachedUser = { name: "Member", avatar: null };
  try {
    const info = await slackGet(`/users.info?user=${encodeURIComponent(uid)}`);
    if (info.ok && info.user) {
      const p = info.user.profile || {};
      resolved = {
        name: p.display_name || p.real_name || info.user.real_name || info.user.name || "Member",
        avatar: p.image_72 || p.image_48 || null,
      };
    }
  } catch {
    // fall back to the default resolved value
  }
  userCache.set(uid, resolved);
  return resolved;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// Convert Slack mrkdwn special tokens into readable plain text (rendered as text,
// not HTML, so there is no XSS surface).
function formatText(text: string, names: Map<string, string>): string {
  if (!text) return "";
  const out = text
    .replace(/<@([A-Z0-9]+)(?:\|[^>]+)?>/g, (_m, id) => `@${names.get(id) || "member"}`)
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, (_m, name) => `#${name}`)
    .replace(/<#[A-Z0-9]+>/g, "#channel")
    .replace(/<!subteam\^[A-Z0-9]+(?:\|([^>]+))?>/g, (_m, name) => name || "@group")
    .replace(/<!(here|channel|everyone)>/g, (_m, k) => `@${k}`)
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, (_m, _url, label) => label)
    .replace(/<(https?:[^>]+)>/g, (_m, url) => url);
  return decodeEntities(out).trim();
}

let cache: { data: CommunityFeed; expires: number } | null = null;
const TTL_MS = 60_000;
const FAILURE_TTL_MS = 15_000;

function cacheDisconnected(): CommunityFeed {
  // Not in channel / not connected / transient error — surface an empty,
  // "not connected" feed and cache it briefly so setup progress is picked up
  // quickly and transient failures don't stampede the Slack API.
  const feed: CommunityFeed = { connected: false, channelName: null, messages: [] };
  cache = { data: feed, expires: Date.now() + FAILURE_TTL_MS };
  return feed;
}

export async function getCommunityFeed(limit = 12): Promise<CommunityFeed> {
  if (cache && cache.expires > Date.now()) return cache.data;

  if (!SLACK_BOT_TOKEN) {
    return cacheDisconnected();
  }

  try {
    const hist = await slackGet(`/conversations.history?channel=${SLACK_CHANNEL_ID}&limit=${limit}`);
    if (!hist.ok) {
      return cacheDisconnected();
    }

    const info = await slackGet(`/conversations.info?channel=${SLACK_CHANNEL_ID}`);
    const channelName = info.ok && info.channel ? info.channel.name : null;

    const raw = (hist.messages || []).filter(
      (m: any) => m.type === "message" && !m.subtype && (m.text || "").trim().length > 0,
    );

    const uids: string[] = Array.from(new Set(raw.map((m: any) => m.user).filter(Boolean)));
    const resolvedList = await Promise.all(uids.map((u) => resolveUser(u)));
    const nameById = new Map<string, string>();
    const userById = new Map<string, CachedUser>();
    uids.forEach((u, i) => {
      nameById.set(u, resolvedList[i].name);
      userById.set(u, resolvedList[i]);
    });

    const messages: CommunityMessage[] = raw
      .map((m: any): CommunityMessage => {
        const u = userById.get(m.user) || { name: "Member", avatar: null };
        return {
          id: m.ts,
          authorName: u.name,
          authorAvatar: u.avatar,
          text: formatText(m.text || "", nameById),
          ts: Math.round(parseFloat(m.ts) * 1000),
        };
      })
      .filter((m: CommunityMessage) => m.text.length > 0);

    const feed: CommunityFeed = { connected: true, channelName, messages };
    cache = { data: feed, expires: Date.now() + TTL_MS };
    return feed;
  } catch {
    return cacheDisconnected();
  }
}
