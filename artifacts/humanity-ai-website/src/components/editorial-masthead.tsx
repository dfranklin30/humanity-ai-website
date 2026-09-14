interface EditorialMastheadProps {
  kicker: string;
  title: string;
  tagline: string;
  issue?: string;
}

export function EditorialMasthead({
  kicker,
  title,
  tagline,
  issue = "Vol. 01",
}: EditorialMastheadProps) {
  return (
    <header
      className="relative isolate overflow-hidden bg-[#FFFFFF] text-[#14201B] py-14 md:py-20 px-4 md:px-8"
      data-testid="editorial-masthead"
    >
      {/* Topographic dotted line-art — matches the homepage hero */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="animate-hero-rings absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-[0.20]"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <circle
              key={i}
              cx="500"
              cy="500"
              r={60 + i * 30}
              fill="none"
              stroke="#0E6B4A"
              strokeWidth="1.1"
              strokeDasharray="2 9"
            />
          ))}
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(110,231,183,0.10),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#FFFFFF]" />
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center space-y-5 text-center">
        <div className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#0E6B4A] flex items-center gap-2">
          <span className="h-px w-6 bg-[#6ee7b7]/50" />
          {kicker}
          <span className="h-px w-6 bg-[#6ee7b7]/50" />
        </div>
        <h1
          className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-center font-bold text-[#14201B]"
          data-testid="text-page-masthead"
        >
          {title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] sm:text-xs font-medium text-[#14201B]/70 uppercase tracking-[0.2em] border-t border-b border-[#14201B]/20 py-2.5 w-full max-w-3xl">
          <span>{issue}</span>
          <span className="hidden sm:inline text-[#0E6B4A]/70">◦</span>
          <span className="text-center">{tagline}</span>
          <span className="hidden sm:inline text-[#0E6B4A]/70">◦</span>
          <span>Est. 2024</span>
        </div>
      </div>
    </header>
  );
}
