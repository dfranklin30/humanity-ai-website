import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/**
 * Locally saved posts and events ("Saved for later").
 *
 * Stored on-device in AsyncStorage; no account required. A tiny
 * listener set keeps every mounted hook in sync when a bookmark
 * changes anywhere in the app.
 */

const STORAGE_KEY = "humanity-ai:bookmarks";

export interface Bookmark {
  /** "post" bookmarks route by slug; "event" bookmarks route by id. */
  type: "post" | "event";
  ref: string;
  title: string;
  subtitle?: string;
  savedAt: number;
}

const keyOf = (type: Bookmark["type"], ref: string) => `${type}:${ref}`;

let cache: Bookmark[] | null = null;
const listeners = new Set<() => void>();

async function readAll(): Promise<Bookmark[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Bookmark[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function writeAll(next: Bookmark[]): Promise<void> {
  cache = next;
  listeners.forEach((fn) => fn());
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal: bookmarks stay for this session even if persistence fails.
  }
}

export async function toggleBookmark(item: Omit<Bookmark, "savedAt">): Promise<boolean> {
  const all = await readAll();
  const k = keyOf(item.type, item.ref);
  const exists = all.some((b) => keyOf(b.type, b.ref) === k);
  const next = exists
    ? all.filter((b) => keyOf(b.type, b.ref) !== k)
    : [{ ...item, savedAt: Date.now() }, ...all];
  await writeAll(next);
  return !exists;
}

/** Reactive list of everything saved, newest first. */
export function useBookmarks(): { bookmarks: Bookmark[]; ready: boolean } {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(cache ?? []);
  const [ready, setReady] = useState(cache !== null);

  useEffect(() => {
    let mounted = true;
    const sync = () => {
      if (mounted && cache) setBookmarks([...cache]);
    };
    listeners.add(sync);
    readAll().then(() => {
      if (mounted) {
        sync();
        setReady(true);
      }
    });
    return () => {
      mounted = false;
      listeners.delete(sync);
    };
  }, []);

  return { bookmarks, ready };
}

/** Reactive saved-state + toggle for a single item. */
export function useBookmark(item: Omit<Bookmark, "savedAt"> | null) {
  const { bookmarks } = useBookmarks();
  const saved = item
    ? bookmarks.some((b) => keyOf(b.type, b.ref) === keyOf(item.type, item.ref))
    : false;

  const toggle = useCallback(() => {
    if (item) toggleBookmark(item).catch(() => {});
  }, [item]);

  return { saved, toggle };
}
