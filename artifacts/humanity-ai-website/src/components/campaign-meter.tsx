import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Users } from "lucide-react";

export interface CampaignProgress {
  slug: string;
  title: string;
  description?: string;
  goalCents: number;
  raisedCents: number;
  donorCount: number;
  category?: string;
}

function formatUSD(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function ProgressBar({
  pct,
  trackClassName = "bg-foreground/10",
  heightClass = "h-2",
}: {
  pct: number;
  trackClassName?: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`${heightClass} w-full ${trackClassName} overflow-hidden rounded-full`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-700 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CampaignMeter({
  campaign,
  variant = "inline",
  className = "",
}: {
  campaign: CampaignProgress;
  variant?: "inline" | "card";
  className?: string;
}) {
  const pct =
    campaign.goalCents > 0
      ? Math.min(100, Math.round((campaign.raisedCents / campaign.goalCents) * 100))
      : 0;

  if (variant === "card") {
    return (
      <div
        className={`border border-foreground/10 bg-white dark:bg-card p-6 md:p-8 ${className}`}
        data-testid={`campaign-card-${campaign.slug}`}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4">
          <Heart className="h-3.5 w-3.5" />
          Fundraising Campaign
        </div>
        <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-3">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="text-muted-foreground leading-relaxed font-serif mb-6">
            {campaign.description}
          </p>
        )}
        <div className="flex items-baseline justify-between mb-2">
          <span
            className="font-serif text-3xl font-bold text-foreground"
            data-testid={`campaign-raised-${campaign.slug}`}
          >
            {formatUSD(campaign.raisedCents)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatUSD(campaign.goalCents)} goal
          </span>
        </div>
        <ProgressBar pct={pct} />
        <div className="flex items-center justify-between mt-3 mb-6 text-xs uppercase tracking-widest font-bold text-muted-foreground">
          <span data-testid={`campaign-pct-${campaign.slug}`}>{pct}% Funded</span>
          <span className="flex items-center gap-1.5 normal-case tracking-normal font-normal">
            <Users className="h-3.5 w-3.5" />
            {campaign.donorCount} {campaign.donorCount === 1 ? "supporter" : "supporters"}
          </span>
        </div>
        <Button asChild className="rounded-none font-serif italic w-full">
          <Link
            href={`/donate?campaign=${campaign.slug}`}
            data-testid={`button-donate-${campaign.slug}`}
          >
            <Heart className="h-4 w-4 mr-2" />
            Support {campaign.title}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`mt-7 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-black/20 ${className}`}
      data-testid={`campaign-inline-${campaign.slug}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300 flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          Fundraising Goal
        </span>
        <span
          className="text-xs font-bold uppercase tracking-widest text-white/80"
          data-testid={`campaign-pct-${campaign.slug}`}
        >
          {pct}% Funded
        </span>
      </div>
      <ProgressBar pct={pct} trackClassName="bg-white/15" heightClass="h-3" />
      <div className="flex items-center justify-between mt-3 mb-5">
        <span className="text-sm">
          <span
            className="font-bold text-white text-base"
            data-testid={`campaign-raised-${campaign.slug}`}
          >
            {formatUSD(campaign.raisedCents)}
          </span>{" "}
          <span className="text-white/70">
            raised of {formatUSD(campaign.goalCents)}
          </span>
        </span>
        <span className="text-xs text-white/70 flex items-center gap-1">
          <Users className="h-3 w-3" />
          {campaign.donorCount}
        </span>
      </div>
      <Button
        asChild
        size="sm"
        className="rounded-none font-serif italic w-full gap-1.5"
      >
        <Link
          href={`/donate?campaign=${campaign.slug}`}
          data-testid={`button-donate-${campaign.slug}`}
        >
          <Heart className="h-3.5 w-3.5" />
          Donate to this campaign
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
