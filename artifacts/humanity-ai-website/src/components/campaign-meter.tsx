import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

export interface CampaignProgress {
  slug: string;
  title: string;
  description?: string;
  goalCents: number;
  raisedCents: number;
  donorCount: number;
  category?: string;
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
  if (variant === "card") {
    return (
      <div
        className={`border border-foreground/10 bg-white dark:bg-card p-6 md:p-8 ${className}`}
        data-testid={`campaign-card-${campaign.slug}`}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-4">
          <Heart className="h-3.5 w-3.5" />
          Support This Work
        </div>
        <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-3 text-[#14201B]">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="text-[#4B5F55] leading-relaxed mb-6">{campaign.description}</p>
        )}
        <Button asChild className="gap-2">
          <Link href="/donate" data-testid={`campaign-donate-${campaign.slug}`}>
            Donate
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={className} data-testid={`campaign-inline-${campaign.slug}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          Support This Work
        </span>
        <Link
          href="/donate"
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8751C] hover:underline inline-flex items-center gap-1"
          data-testid={`campaign-donate-inline-${campaign.slug}`}
        >
          Donate
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {campaign.description && (
        <p className="text-sm text-[#4B5F55] leading-relaxed">{campaign.description}</p>
      )}
    </div>
  );
}
