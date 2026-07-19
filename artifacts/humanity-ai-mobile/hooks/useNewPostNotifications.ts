import { useEffect } from "react";

import { useBlogPosts } from "@/lib/api";
import { notifyAboutNewPosts } from "@/services/notifications";

/**
 * On app open, fetches the latest updates and raises a local notification
 * when new posts have been published since the last visit.
 */
export function useNewPostNotifications() {
  const { data } = useBlogPosts();

  useEffect(() => {
    if (data && data.length > 0) {
      notifyAboutNewPosts(data).catch(() => {});
    }
  }, [data]);
}
