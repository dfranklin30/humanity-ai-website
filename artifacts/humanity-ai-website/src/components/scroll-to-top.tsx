import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scroll to the top on route change — unless the URL carries a hash
 * (e.g. /training#claude-hacks), in which case scroll to that element
 * once it has rendered.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts++ < 20) {
        // Content may still be mounting/animating in; retry briefly.
        window.setTimeout(tryScroll, 100);
      }
    };
    tryScroll();
  }, [location]);

  return null;
}
