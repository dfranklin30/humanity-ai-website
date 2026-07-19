import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { BlogPost } from "@/lib/api";

const LAST_SEEN_POST_KEY = "humanity-ai:last-seen-post-id";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (settings.canAskAgain) {
      const request = await Notifications.requestPermissionsAsync();
      return request.granted;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Compares the freshly fetched posts against the last-seen post id in
 * AsyncStorage and fires a local notification when new updates exist.
 * On first launch it just records the newest id (no notification spam).
 */
export async function notifyAboutNewPosts(posts: BlogPost[]): Promise<void> {
  if (Platform.OS === "web" || posts.length === 0) return;

  const newest = posts.reduce((a, b) => (b.id > a.id ? b : a), posts[0]);
  const stored = await AsyncStorage.getItem(LAST_SEEN_POST_KEY);

  if (stored === null) {
    await AsyncStorage.setItem(LAST_SEEN_POST_KEY, String(newest.id));
    return;
  }

  const lastSeenId = Number(stored);
  if (!Number.isFinite(lastSeenId) || newest.id <= lastSeenId) {
    await AsyncStorage.setItem(LAST_SEEN_POST_KEY, String(newest.id));
    return;
  }

  const fresh = posts.filter((p) => p.id > lastSeenId);
  const granted = await ensureNotificationPermissions();
  if (granted && fresh.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          fresh.length === 1
            ? "New update from Humanity + AI"
            : `${fresh.length} new updates from Humanity + AI`,
        body: newest.title,
      },
      trigger: null,
    });
  }

  await AsyncStorage.setItem(LAST_SEEN_POST_KEY, String(newest.id));
}
