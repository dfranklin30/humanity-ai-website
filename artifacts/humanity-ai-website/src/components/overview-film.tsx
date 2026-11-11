import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VIDEO_BASE_URL } from "@/data/claude-hacks";

// A four-minute narrated tour of the site, the AI for Kids Hub, and the membership program.
// The file lives in media/training-videos/ and is synced to Blob Storage by the deploy workflow.
const FILM = `${VIDEO_BASE_URL}/humanity-ai-overview.mp4`;
const POSTER = `${VIDEO_BASE_URL}/humanity-ai-overview.jpg`;

export function OverviewFilm() {
  return (
    <section className="bg-[#FAF9F6] text-[#14201B]" data-testid="section-overview-film">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-16 md:py-20 text-center">
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase text-[#1f6b4f] flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-6 bg-[#1f6b4f]/50" />
          Watch · 4 minutes
          <span className="h-px w-6 bg-[#1f6b4f]/50" />
        </div>
        <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Humanity + AI, <span className="italic text-[#1f6b4f]">in four minutes.</span>
        </h2>
        <p className="max-w-2xl mx-auto text-base md:text-lg text-[#14201B]/70 mb-10">
          What we do, who leads it, and how kids and adults learn AI with us. Grow, learn, and be
          part of something bigger.
        </p>
        <video
          className="w-full aspect-video rounded-2xl border border-[#14201B]/10 shadow-xl bg-black"
          src={FILM}
          poster={POSTER}
          controls
          playsInline
          preload="none"
          data-testid="video-overview-film"
        />
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 h-12 bg-[#f0c674] text-[#14201B] hover:bg-[#e8b955] font-semibold"
            data-testid="button-overview-member"
          >
            <Link href="/donate">
              <Sparkles className="h-4 w-4 mr-2" />
              Become a Member · From $10/mo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-[#14201B]/60">
            We are a 501(c)(3) nonprofit. All proceeds go back to the community.
          </p>
        </div>
      </div>
    </section>
  );
}
