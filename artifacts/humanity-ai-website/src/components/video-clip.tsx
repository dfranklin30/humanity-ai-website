import { Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { clipUrl, posterUrl, type VideoClip } from "@/data/claude-hacks";

interface VideoClipCardProps {
  clip: VideoClip;
  /** Compact = no description block (used in tight grids). */
  compact?: boolean;
  className?: string;
}

/**
 * Self-hosted MP4 player card. Videos are streamed straight from Azure Blob
 * Storage, so the page bundle never grows as clips are added.
 */
export function VideoClipCard({ clip, compact = false, className = "" }: VideoClipCardProps) {
  const portrait = clip.orientation === "portrait";
  return (
    <figure
      className={`group rounded-xl border bg-card overflow-hidden ${className}`}
      data-testid={`video-clip-${clip.id}`}
    >
      <div
        className={`relative bg-black ${portrait ? "aspect-[9/16] max-h-[560px] mx-auto" : "aspect-video"}`}
      >
        <video
          className="absolute inset-0 h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          poster={posterUrl(clip)}
          aria-label={clip.title}
        >
          <source src={clipUrl(clip)} type="video/mp4" />
          Your browser doesn't support embedded video.{" "}
          <a href={clipUrl(clip)}>Download the clip</a> instead.
        </video>
      </div>
      <figcaption className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-muted-foreground">
          {clip.episode && (
            <span className="font-semibold text-primary uppercase tracking-wider">{clip.episode}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {clip.duration}
          </span>
          {portrait && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" /> Short
            </span>
          )}
        </div>
        <h4 className="font-serif text-base font-bold leading-snug">{clip.title}</h4>
        {!compact && (
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{clip.description}</p>
        )}
        {clip.tags && clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {clip.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
