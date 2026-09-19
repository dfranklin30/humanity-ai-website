import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Heart, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "fundraising-banner-dismissed-v1";

export function FundraisingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative w-full bg-[#FBFAF7]/70 backdrop-blur-sm text-[#14201B] border-b border-[#A8751C]/30"
      data-testid="banner-fundraising"
    >
      <div className="max-w-[1400px] mx-auto px-4 py-2.5 pr-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center">
        <span className="inline-flex items-center gap-2 text-[#A8751C] font-bold uppercase tracking-[0.16em] text-[11px] sm:text-sm">
          <Heart className="h-4 w-4" />
          Help us fund the initiatives shaping responsible AI
        </span>
        <Link href="/donate" data-testid="link-banner-donate">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0c674] text-[#14201B] font-bold text-xs px-4 py-1 hover:scale-105 transition-transform cursor-pointer">
            Donate <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss fundraising banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14201B]/60 hover:text-[#14201B] transition-colors"
        data-testid="button-dismiss-banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
