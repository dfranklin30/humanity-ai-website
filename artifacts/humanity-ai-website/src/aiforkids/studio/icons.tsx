import type { ReactElement } from "react";
/**
 * Sticker icons for the Kids AI Studio.
 *
 * One hand-drawn-feeling, two-tone SVG per room, drawn on a 64x64 grid with
 * thick rounded strokes so they read at 40px and at 120px alike. Each room
 * has its own accent, used for the icon, the tile behind it and the button,
 * so a child learns "green is the game room" without reading anything.
 */

export type RoomId = "game" | "story" | "prompt" | "music" | "quest" | "video" | "robot" | "homework" | "language" | "lounge" | "arcade" | "portfolio";

export const ROOM_THEME: Record<RoomId, { accent: string; tile: string; ring: string; name: string }> = {
  game: { accent: "#16a34a", tile: "#dcfce7", ring: "ring-green-200", name: "Game Maker" },
  story: { accent: "#ea580c", tile: "#ffedd5", ring: "ring-orange-200", name: "Story Maker" },
  prompt: { accent: "#db2777", tile: "#fce7f3", ring: "ring-pink-200", name: "Prompt Craft" },
  music: { accent: "#7c3aed", tile: "#ede9fe", ring: "ring-violet-200", name: "Music Maker" },
  quest: { accent: "#0891b2", tile: "#cffafe", ring: "ring-cyan-200", name: "Quest Helper" },
  video: { accent: "#dc2626", tile: "#fee2e2", ring: "ring-red-200", name: "Video Maker" },
  robot: { accent: "#475569", tile: "#e2e8f0", ring: "ring-slate-300", name: "Robotics Lab" },
  homework: { accent: "#2563eb", tile: "#dbeafe", ring: "ring-blue-200", name: "Study Desk" },
  language: { accent: "#059669", tile: "#d1fae5", ring: "ring-emerald-200", name: "Language Passport" },
  lounge: { accent: "#0d9488", tile: "#ccfbf1", ring: "ring-teal-200", name: "Screen Time Lounge" },
  arcade: { accent: "#ca8a04", tile: "#fef9c3", ring: "ring-yellow-200", name: "Arcade" },
  portfolio: { accent: "#9333ea", tile: "#f3e8ff", ring: "ring-purple-200", name: "My stuff" },
};

const S = { fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Game() {
  return (
    <g>
      <path d="M18 22h28c8 0 12 6 12 14l-1 10c-1 6-8 8-12 3l-4-5H23l-4 5c-4 5-11 3-12-3L6 36c0-8 4-14 12-14z" fill="currentColor" opacity=".18" />
      <path {...S} d="M18 22h28c8 0 12 6 12 14l-1 10c-1 6-8 8-12 3l-4-5H23l-4 5c-4 5-11 3-12-3L6 36c0-8 4-14 12-14z" />
      <path {...S} d="M20 30v10M15 35h10" />
      <circle cx="43" cy="32" r="2.5" fill="currentColor" />
      <circle cx="49" cy="38" r="2.5" fill="currentColor" />
    </g>
  );
}
function Story() {
  return (
    <g>
      <path d="M32 18c-6-4-14-5-22-3v34c8-2 16-1 22 3 6-4 14-5 22-3V15c-8-2-16-1-22 3z" fill="currentColor" opacity=".18" />
      <path {...S} d="M32 18c-6-4-14-5-22-3v34c8-2 16-1 22 3V18zM32 18c6-4 14-5 22-3v34c-8-2-16-1-22 3" />
      <path {...S} d="M17 26h9M17 34h9M38 26h9M38 34h9" opacity=".7" />
    </g>
  );
}
function Prompt() {
  return (
    <g>
      <path d="M44 8l12 12-26 26-14 2 2-14z" fill="currentColor" opacity=".18" />
      <path {...S} d="M44 8l12 12-26 26-14 2 2-14z" />
      <path {...S} d="M38 14l12 12" />
      <path {...S} d="M10 56c8-4 14-2 22-6" opacity=".7" />
    </g>
  );
}
function Music() {
  return (
    <g>
      <path d="M26 46a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM54 40a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" fill="currentColor" opacity=".18" />
      <path {...S} d="M26 46V14l28-6v32" />
      <circle {...S} cx="18" cy="46" r="8" />
      <circle {...S} cx="46" cy="40" r="8" />
      <path {...S} d="M26 24l28-6" />
    </g>
  );
}
function Quest() {
  return (
    <g>
      <circle cx="32" cy="32" r="24" fill="currentColor" opacity=".18" />
      <circle {...S} cx="32" cy="32" r="24" />
      <path d="M40 24l-5 13-13 5 5-13z" fill="currentColor" />
      <path {...S} d="M32 10v4M32 50v4M10 32h4M50 32h4" />
    </g>
  );
}
function Video() {
  return (
    <g>
      <path d="M8 26h48v24a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" fill="currentColor" opacity=".18" />
      <path {...S} d="M8 26h48v24a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6zM8 26l6-14 42 8-6 6" />
      <path {...S} d="M20 14l6 10M32 16l6 10" />
      <path d="M28 36l10 6-10 6z" fill="currentColor" />
    </g>
  );
}
function Robot() {
  return (
    <g>
      <rect x="12" y="20" width="40" height="32" rx="10" fill="currentColor" opacity=".18" />
      <rect {...S} x="12" y="20" width="40" height="32" rx="10" />
      <path {...S} d="M32 20v-8M32 8a3 3 0 1 0 0 .1M4 34v8M60 34v8" />
      <circle cx="24" cy="34" r="3.5" fill="currentColor" />
      <circle cx="40" cy="34" r="3.5" fill="currentColor" />
      <path {...S} d="M24 44c4 3 12 3 16 0" />
    </g>
  );
}
function Homework() {
  return (
    <g>
      <path d="M14 10h26l10 10v34H14z" fill="currentColor" opacity=".18" />
      <path {...S} d="M14 10h26l10 10v34H14zM40 10v10h10" />
      <path {...S} d="M22 30h20M22 38h20M22 46h12" opacity=".8" />
      <path {...S} d="M46 50l10-10 4 4-10 10-5 1z" fill="currentColor" opacity=".9" />
    </g>
  );
}
function Lounge() {
  return (
    <g>
      <rect x="8" y="12" width="48" height="32" rx="6" fill="currentColor" opacity=".18" />
      <rect {...S} x="8" y="12" width="48" height="32" rx="6" />
      <path d="M27 21l12 7-12 7z" fill="currentColor" />
      <path {...S} d="M24 52h16M32 44v8" />
      <path {...S} d="M6 58h52" opacity=".5" />
    </g>
  );
}
function Arcade() {
  return (
    <g>
      <rect x="14" y="8" width="36" height="48" rx="8" fill="currentColor" opacity=".18" />
      <rect {...S} x="14" y="8" width="36" height="48" rx="8" />
      <rect {...S} x="21" y="15" width="22" height="16" rx="3" />
      <circle cx="26" cy="42" r="3.5" fill="currentColor" />
      <circle cx="38" cy="42" r="3.5" fill="currentColor" />
      <circle cx="44" cy="48" r="3.5" fill="currentColor" />
    </g>
  );
}
function Portfolio() {
  return (
    <g>
      <path d="M8 18h18l6 6h24v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
      <path {...S} d="M8 18h18l6 6h24v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />
      <path {...S} d="M8 32h48" opacity=".6" />
    </g>
  );
}

/** Language Passport: a passport with a speech bubble. */
function Language() {
  return (
    <g>
      <rect x="10" y="8" width="30" height="44" rx="4" fill="currentColor" opacity=".18" />
      <rect {...S} x="10" y="8" width="30" height="44" rx="4" />
      <circle {...S} cx="25" cy="26" r="7" />
      <path {...S} d="M18 26h14M25 19c-3 4-3 10 0 14M25 19c3 4 3 10 0 14" strokeWidth={2.5} />
      <path {...S} d="M17 42h16" />
      <path d="M42 30h14a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-6l-5 5v-5h-3a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill="currentColor" opacity=".25" />
      <path {...S} d="M42 30h14a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-6l-5 5v-5h-3a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" strokeWidth={3} />
    </g>
  );
}

const DRAW: Record<RoomId, () => ReactElement> = { game: Game, story: Story, prompt: Prompt, music: Music, quest: Quest, video: Video, robot: Robot, homework: Homework, language: Language, lounge: Lounge, arcade: Arcade, portfolio: Portfolio };

/** A sticker: the icon on its pastel tile, in the room's colour. */
export function RoomIcon({ id, size = 56, tile = true, className = "" }: { id: RoomId; size?: number; tile?: boolean; className?: string }) {
  const theme = ROOM_THEME[id] ?? ROOM_THEME.portfolio;
  const Draw = DRAW[id] ?? Portfolio;
  const pad = Math.round(size * 0.18);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size + pad * 2, height: size + pad * 2, borderRadius: Math.round(size * 0.36), background: tile ? theme.tile : "transparent", color: theme.accent }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 64 64">
        <Draw />
      </svg>
    </span>
  );
}

export function roomIdFor(modeId: string): RoomId {
  return (modeId in ROOM_THEME ? modeId : "portfolio") as RoomId;
}
