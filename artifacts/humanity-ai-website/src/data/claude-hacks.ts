// ============================================================
// Claude Hacks — video clip registry
//
// This is the ONE file to edit when publishing a new clip.
// Pipeline (see deploy/AZURE_RUNBOOK.md):
//   1. Upload the .mp4 (and a .jpg poster) to the `training-videos`
//      container in the `sthumanityplusai` storage account.
//   2. Add an entry to `claudeHacksClips` below (newest first).
//   3. Commit + push to main → GitHub Actions rebuilds and deploys.
//
// `scripts/publish-clip.sh` does steps 1–2 for you.
// ============================================================

export const VIDEO_BASE_URL =
  "https://sthumanityplusai.blob.core.windows.net/training-videos";

export interface VideoClip {
  /** URL-safe id; also used as the data-testid suffix. */
  id: string;
  /** Series episode label, e.g. "Ep. 03". Optional for shorts. */
  episode?: string;
  title: string;
  description: string;
  /** File name inside the training-videos container. */
  file: string;
  /** Poster image file name inside the container (optional). */
  poster?: string;
  /** Human-readable length, e.g. "2 min". */
  duration: string;
  orientation: "landscape" | "portrait";
  /** ISO date the clip was published on the site. */
  published: string;
  /** Exactly one clip should be featured; it appears on the homepage. */
  featured?: boolean;
  tags?: string[];
}

export const claudeHacksClips: VideoClip[] = [
  {
    id: "ep03-claude-hacks",
    episode: "Ep. 03",
    title: "Claude Hacks: Projects, Cowork & Everyday Workflows",
    description:
      "Danielle walks through how Humanity + AI actually uses Claude day to day — setting up a shared Project so Claude remembers your context, starting tasks in Cowork, and turning repetitive nonprofit chores into two-minute workflows.",
    file: "claude-hacks-ep03.mp4",
    poster: "poster-ep03.jpg",
    duration: "2 min",
    orientation: "landscape",
    published: "2026-09-08",
    featured: true,
    tags: ["Claude", "Projects", "Cowork", "Workflows"],
  },
  {
    id: "setting-up-a-project",
    title: "Setting Up a Project in Claude",
    description:
      "A one-minute short: create a Project, give it a description and instructions, and attach the documents Claude should reference every time you talk to it.",
    file: "claude-hacks-setting-up-a-project.mp4",
    poster: "poster-setting-up-a-project.jpg",
    duration: "1 min",
    orientation: "portrait",
    published: "2026-09-08",
    tags: ["Claude", "Projects", "Quick Start"],
  },
];

export const clipUrl = (clip: VideoClip) => `${VIDEO_BASE_URL}/${clip.file}`;
export const posterUrl = (clip: VideoClip) =>
  clip.poster ? `${VIDEO_BASE_URL}/${clip.poster}` : undefined;
export const featuredClip = () =>
  claudeHacksClips.find((c) => c.featured) ?? claudeHacksClips[0];
