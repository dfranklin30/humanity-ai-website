import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE_URL } from "@/lib/api";

/**
 * Native client for the Humanity + AI assistant.
 *
 * Talks to the same conversation API that powers the website's AI
 * assistant (see api-server routes: /api/conversations). Responses
 * stream back as server-sent events; on React Native we read them
 * incrementally through XMLHttpRequest's progressive responseText.
 */

const CONVERSATION_KEY = "humanity-ai:conversation-id";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface ConversationWithMessages {
  id: number;
  title: string;
  messages: ChatMessage[];
}

async function createConversation(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Mobile chat" }),
  });
  if (!res.ok) throw new Error(`Could not start a conversation (${res.status})`);
  const conv = (await res.json()) as { id: number };
  await AsyncStorage.setItem(CONVERSATION_KEY, String(conv.id));
  return conv.id;
}

/** Returns the stored conversation's history, or null when none exists yet. */
export async function loadStoredConversation(): Promise<ConversationWithMessages | null> {
  const stored = await AsyncStorage.getItem(CONVERSATION_KEY);
  if (!stored) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${stored}`);
    if (!res.ok) return null;
    return (await res.json()) as ConversationWithMessages;
  } catch {
    return null;
  }
}

/** Ensures a conversation exists and returns its id. */
export async function ensureConversation(): Promise<number> {
  const stored = await AsyncStorage.getItem(CONVERSATION_KEY);
  if (stored) {
    const id = Number(stored);
    if (Number.isFinite(id)) return id;
  }
  return createConversation();
}

/** Forgets the current thread and starts a fresh one on next send. */
export async function resetConversation(): Promise<void> {
  await AsyncStorage.removeItem(CONVERSATION_KEY);
}

/**
 * Sends a message and streams the assistant's reply.
 *
 * onChunk receives the incremental text as it arrives. The returned
 * promise resolves with the full reply once the stream completes.
 */
export function sendChatMessage(
  conversationId: number,
  content: string,
  onChunk: (partial: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let seen = 0;
    let full = "";
    let done = false;

    const consume = () => {
      const text = xhr.responseText || "";
      if (text.length <= seen) return;
      const fresh = text.slice(seen);
      // Only consume up to the last complete SSE frame.
      const lastFrame = fresh.lastIndexOf("\n\n");
      if (lastFrame === -1) return;
      seen += lastFrame + 2;
      for (const line of fresh.slice(0, lastFrame).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice(6)) as {
            content?: string;
            done?: boolean;
            error?: string;
          };
          if (payload.content) {
            full += payload.content;
            onChunk(full);
          }
          if (payload.error) {
            done = true;
            reject(new Error(payload.error));
          }
          if (payload.done) done = true;
        } catch {
          // Ignore partial/malformed frames; they re-appear complete later.
        }
      }
    };

    xhr.open("POST", `${API_BASE_URL}/api/conversations/${conversationId}/messages`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onprogress = consume;
    xhr.onload = () => {
      consume();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(full);
      } else if (!done) {
        reject(new Error(`The assistant is unavailable right now (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection."));
    xhr.send(JSON.stringify({ content }));
  });
}
