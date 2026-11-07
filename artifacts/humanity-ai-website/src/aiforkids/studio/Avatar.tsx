/**
 * Kids AI Studio — one avatar, drawn well.
 *
 * An avatar value is either an emoji character or `img:<id>-<token>` for a
 * picture a child made in the Emoji Playground. Emoji are drawn from the 3D
 * Fluent Emoji set served from /aiforkids/avatars (see the README there), so
 * a 🦊 is the same glossy fox on a Chromebook, an iPad and the projector
 * instead of whatever font the device has. Any emoji without a picture, and
 * any picture that fails to load, falls back to the character.
 */
import { useState } from "react";
import { cx } from "../components/ui";

/** Emoji → file stem under /aiforkids/avatars/. Generated from the download manifest; keep in step with AVATARS on the server. */
const ART: Record<string, string> = {
  "🦊": "1f98a", "🐼": "1f43c", "🐸": "1f438", "🦄": "1f984", "🐙": "1f419", "🦖": "1f996", "🐧": "1f427", "🦋": "1f98b", "🐯": "1f42f", "🐢": "1f422",
  "🦜": "1f99c", "🐨": "1f428", "🦁": "1f981", "🐰": "1f430", "🐳": "1f433", "🦔": "1f994", "🐝": "1f41d", "🦩": "1f9a9", "🐲": "1f432", "🤖": "1f916",
  "🐱": "1f431", "🐶": "1f436", "🐵": "1f435", "🐮": "1f42e", "🐷": "1f437", "🐭": "1f42d", "🐹": "1f439", "🐻": "1f43b", "🦓": "1f993", "🦒": "1f992",
  "🦘": "1f998", "🦥": "1f9a5", "🦦": "1f9a6", "🦉": "1f989", "🦅": "1f985", "🦚": "1f99a", "🦢": "1f9a2", "🐬": "1f42c", "🦈": "1f988", "🐠": "1f420",
  "🐡": "1f421", "🦀": "1f980", "🐌": "1f40c", "🐞": "1f41e", "🌵": "1f335", "🌻": "1f33b", "🍄": "1f344", "🍕": "1f355", "🍩": "1f369", "🧁": "1f9c1",
  "🚀": "1f680", "🛸": "1f6f8", "🪐": "1fa90", "⭐": "2b50", "🌈": "1f308", "🎸": "1f3b8", "🎮": "1f3ae", "🧩": "1f9e9", "👾": "1f47e", "🦸": "1f9b8",
  "🧙": "1f9d9", "🧚": "1f9da", "🥷": "1f977", "🏀": "1f3c0", "⚽": "26bd", "🎨": "1f3a8", "🎲": "1f3b2",
};

const CUSTOM_RE = /^img:(\d+)-([a-f0-9]{16})$/;

export function isCustomAvatar(value: string | null | undefined): boolean {
  return !!value && CUSTOM_RE.test(value);
}

/** Where the picture for an avatar value is, or null to draw the character itself. */
export function avatarSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = CUSTOM_RE.exec(value);
  if (m) return `/api/aik/avatars/${m[1]}/${m[2]}`;
  const stem = ART[value];
  return stem ? `/aiforkids/avatars/${stem}.png` : null;
}

const SIZES = {
  xs: "h-5 w-5 text-base",
  sm: "h-7 w-7 text-xl",
  md: "h-10 w-10 text-3xl",
  lg: "h-14 w-14 text-4xl",
  xl: "h-20 w-20 text-5xl",
} as const;

export type AvatarSize = keyof typeof SIZES;

export function Avatar({ value, size = "md", className, title }: { value: string | null | undefined; size?: AvatarSize; className?: string; title?: string }) {
  const [broken, setBroken] = useState(false);
  const src = broken ? null : avatarSrc(value);
  const custom = isCustomAvatar(value);
  if (!value) return null;
  return (
    <span className={cx("inline-flex shrink-0 select-none items-center justify-center align-middle leading-none", SIZES[size], className)} title={title} aria-hidden={title ? undefined : true}>
      {src ? (
        <img
          src={src}
          alt={title ?? ""}
          draggable={false}
          loading="lazy"
          onError={() => setBroken(true)}
          className={cx("h-full w-full object-cover", custom ? "rounded-full ring-2 ring-white shadow-sm" : "drop-shadow-sm")}
        />
      ) : (
        <span>{custom ? "🙂" : value}</span>
      )}
    </span>
  );
}
