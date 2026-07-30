import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Radio, FileText } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  category: string;
}
interface ArxivItem {
  title: string;
  authors: string;
  url: string;
  published: string | null;
  summary: string;
}
interface NewsPayload {
  ticker: NewsItem[];
  arxiv: ArxivItem[];
  updatedAt: string;
}

function dotClass(category: string): string {
  return (
    "mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full " +
    (category === "markets"
      ? "bg-emerald-400"
      : category === "research"
        ? "bg-sky-400"
        : "bg-[#f0c674]")
  );
}

// Rolling "AI News" highlights — headlines from AI news, frontier-model news,
// markets, and arXiv, each clickable straight to the source. The stack scrolls
// vertically and pauses on hover so anything interesting can be clicked.
export function AINewsTicker() {
  const { data } = useQuery<NewsPayload>({
    queryKey: ["/api/news"],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
  const items = data?.ticker || [];
  if (!items.length) return null;
  const loop = [...items, ...items]; // duplicate so the scroll loops seamlessly
  // Keep a steady reading pace regardless of how many headlines came back.
  const durationSec = Math.max(30, items.length * 4);

  return (
    <div
      className="relative w-full bg-[#06130d] border-b border-[#f0c674]/20 overflow-hidden"
      data-testid="bar-ai-news"
    >
      <style>{`
        @keyframes ai-news-scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        .ai-news-track { animation: ai-news-scroll-up ${durationSec}s linear infinite; will-change: transform; }
        .ai-news-viewport:hover .ai-news-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ai-news-track { animation: none; } }
      `}</style>
      <div className="flex items-stretch">
        <div className="flex flex-col items-center justify-center gap-2 shrink-0 px-3 sm:px-4 py-3 bg-[#f0c674] text-[#081c14] font-extrabold uppercase tracking-[0.14em] text-[10px] sm:text-xs z-10">
          <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
          <span className="text-center leading-tight">
            AI
            <br />
            News
          </span>
        </div>
        <div className="ai-news-viewport relative flex-1 overflow-hidden h-[96px] sm:h-[104px]">
          <div className="ai-news-track flex flex-col">
            {loop.map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 px-4 sm:px-5 py-1.5 text-[13px] leading-snug text-[#e7efe9] hover:text-[#f0c674] transition-colors"
                data-testid={`ticker-item-${i}`}
              >
                <span className={dotClass(n.category)} />
                <span className="font-semibold text-[#9fb3a6] shrink-0">{n.source}</span>
                <span className="opacity-90 line-clamp-1">{n.title}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60 shrink-0 mt-[2px]" />
              </a>
            ))}
          </div>
          {/* Soft fades so headlines slide in and out rather than snapping. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[#06130d] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#06130d] to-transparent" />
        </div>
      </div>
    </div>
  );
}

// "Latest AI Research & Models" — newest arXiv papers, streamed onto the homepage.
export function ArxivFeed() {
  const { data } = useQuery<NewsPayload>({
    queryKey: ["/api/news"],
    staleTime: 5 * 60 * 1000,
  });
  const papers = data?.arxiv || [];
  if (!papers.length) return null;

  return (
    <section
      className="relative isolate w-full bg-[#0a2117]/70 backdrop-blur-[2px] text-[#FAF9F6] py-14 border-b border-white/10"
      data-testid="section-arxiv"
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[#f0c674] font-bold uppercase tracking-[0.16em] text-xs mb-2">
              <FileText className="h-4 w-4" /> Latest AI Research &amp; Models
            </div>
            <h2 className="text-2xl md:text-4xl font-serif">Fresh from arXiv</h2>
          </div>
          <a
            href="https://arxiv.org/list/cs.AI/recent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#f0c674] hover:underline inline-flex items-center gap-1"
            data-testid="link-arxiv-all"
          >
            Browse all <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.slice(0, 6).map((p, i) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#f0c674]/40 transition-colors p-5 flex flex-col"
              data-testid={`arxiv-card-${i}`}
            >
              <div className="text-[11px] uppercase tracking-widest text-sky-300/80 mb-2">
                {p.published
                  ? new Date(p.published).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : "arXiv"}
              </div>
              <h3 className="font-semibold leading-snug mb-2 group-hover:text-[#f0c674] transition-colors line-clamp-3">
                {p.title}
              </h3>
              {p.authors && (
                <div className="text-xs text-[#9fb3a6] mb-2 line-clamp-1">{p.authors}</div>
              )}
              <p className="text-[13px] text-[#c9d6ce]/80 line-clamp-3 flex-1">{p.summary}</p>
              <div className="mt-3 text-[#f0c674] text-xs font-semibold inline-flex items-center gap-1">
                Read on arXiv <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
