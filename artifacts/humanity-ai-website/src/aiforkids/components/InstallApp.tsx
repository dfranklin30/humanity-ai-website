import { useEffect, useState } from "react";

/**
 * "Install Kids AI" for Windows laptops, Chromebooks and Macs.
 *
 * Windows can't run the Google Play app, so the Studio, Hub and Facilitator
 * install from the browser instead: Edge and Chrome read the manifest at
 * /aiforkids/app.webmanifest and put "Kids AI" in the Start menu / launcher,
 * with its own window and taskbar icon. The app always loads the live pages,
 * so there is nothing to update and no offline copy of anyone's work.
 *
 * The manifest link is added only while an /aiforkids page is showing, so the
 * Humanity + AI marketing site never offers itself as "Kids AI".
 */

const MANIFEST_HREF = "/aiforkids/app.webmanifest";
const DISMISS_KEY = "aik-install-dismissed";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The browser can fire beforeinstallprompt before React mounts the banner,
// so catch it at module load and hand it over later.
let pending: InstallPromptEvent | null = null;
const listeners = new Set<(e: InstallPromptEvent | null) => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pending = e as InstallPromptEvent;
    listeners.forEach((fn) => fn(pending));
  });
  window.addEventListener("appinstalled", () => {
    pending = null;
    listeners.forEach((fn) => fn(null));
  });
}

function ensureHead(selector: string, make: () => HTMLElement): HTMLElement {
  const found = document.head.querySelector<HTMLElement>(selector);
  if (found) return found;
  const el = make();
  el.dataset.aikApp = "1";
  document.head.appendChild(el);
  return el;
}

/** Adds the manifest (and app icon/colour hints) while mounted. */
export function useKidsAppManifest() {
  useEffect(() => {
    ensureHead(`link[rel="manifest"]`, () => {
      const l = document.createElement("link");
      l.rel = "manifest";
      l.href = MANIFEST_HREF;
      return l;
    });
    ensureHead(`meta[name="theme-color"]`, () => {
      const m = document.createElement("meta");
      m.name = "theme-color";
      m.content = "#111111";
      return m;
    });
    ensureHead(`link[rel="apple-touch-icon"][data-aik-app]`, () => {
      const l = document.createElement("link");
      l.rel = "apple-touch-icon";
      l.href = "/aiforkids/app/icon-192.png";
      return l;
    });
    return () => {
      document.head.querySelectorAll("[data-aik-app]").forEach((el) => el.remove());
    };
  }, []);
}

function runningAsApp(): boolean {
  if (typeof window === "undefined") return false;
  // Android phones and tablets have the real app on Google Play; offer the
  // browser install only to computers (Windows, Mac, Linux, ChromeOS).
  if (/Android/i.test(navigator.userAgent)) return true;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A slim bar across the top: "Install Kids AI on this computer". Shown only
 * when the browser says the app can be installed, and not inside the app
 * itself. "Not now" hides it on this browser.
 */
export function InstallAppBar() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(pending);
  const [hidden, setHidden] = useState<boolean>(() => runningAsApp() || readDismissed());

  useEffect(() => {
    const fn = (e: InstallPromptEvent | null) => setPrompt(e);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  if (hidden || !prompt) return null;

  const install = async () => {
    const e = prompt;
    pending = null;
    setPrompt(null);
    await e.prompt();
    await e.userChoice.catch(() => undefined);
  };

  const notNow = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private window: hide for this visit only */
    }
    setHidden(true);
  };

  return (
    <div
      role="region"
      aria-label="Install the Kids AI app"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-slate-900 px-4 py-2 text-sm text-white"
    >
      <span className="flex items-center gap-2">
        <img src="/aiforkids/app/icon-192.png" alt="" className="h-6 w-6 rounded" />
        <span>
          <b>Install Kids AI</b> on this computer: its own window, Start-menu icon and taskbar pin.
        </span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          className="rounded-full bg-white px-4 py-1 font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Install
        </button>
        <button
          type="button"
          onClick={notNow}
          className="rounded-full px-3 py-1 text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Not now
        </button>
      </span>
    </div>
  );
}
