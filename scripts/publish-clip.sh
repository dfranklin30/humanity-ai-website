#!/usr/bin/env bash
# ============================================================
# publish-clip.sh — add a Claude Hacks video to the website
#
# Usage:
#   scripts/publish-clip.sh path/to/clip.mp4 "Clip Title" [--episode "Ep. 04"] \
#       [--desc "One or two sentences."] [--tags "Claude,Cowork"] [--featured]
#
# What it does:
#   1. Re-encodes the clip for the web (H.264, fast-start) if ffmpeg is present,
#      and grabs a poster frame (.jpg).
#   2. Copies both into media/training-videos/  (the deploy workflow syncs this
#      folder to Azure Blob Storage — no Azure CLI needed on your machine).
#   3. Inserts a new entry at the top of
#      artifacts/humanity-ai-website/src/data/claude-hacks.ts
#      (and clears the previous `featured` flag if --featured is given).
#   4. Prints the git commands to ship it. Pushing to main deploys.
#
# Requirements: node. ffmpeg optional but recommended (brew install ffmpeg).
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEDIA_DIR="$REPO_ROOT/media/training-videos"
DATA_FILE="$REPO_ROOT/artifacts/humanity-ai-website/src/data/claude-hacks.ts"

usage() { sed -n '2,20p' "$0"; exit 1; }
[ $# -ge 2 ] || usage

SRC="$1"; TITLE="$2"; shift 2
EPISODE=""; DESC=""; TAGS="Claude"; FEATURED="false"
while [ $# -gt 0 ]; do
  case "$1" in
    --episode)  EPISODE="$2"; shift 2 ;;
    --desc)     DESC="$2"; shift 2 ;;
    --tags)     TAGS="$2"; shift 2 ;;
    --featured) FEATURED="true"; shift ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[ -f "$SRC" ] || { echo "ERROR: file not found: $SRC"; exit 1; }
command -v node >/dev/null || { echo "ERROR: node is required."; exit 1; }
mkdir -p "$MEDIA_DIR"

# ---- 1. slug + filenames ------------------------------------------------
slugify() { echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'; }
ID="$(slugify "${EPISODE:+$EPISODE }$TITLE" | cut -c1-60)"
MP4="claude-hacks-${ID}.mp4"
POSTER="poster-${ID}.jpg"
if [ -e "$MEDIA_DIR/$MP4" ]; then
  echo "ERROR: $MP4 already exists in media/training-videos — pick a different title/episode."; exit 1
fi

# ---- 2. probe + encode + poster -------------------------------------------
ORIENTATION="landscape"; DURATION="1 min"
if command -v ffprobe >/dev/null; then
  W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$SRC" | head -1)
  H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$SRC" | head -1)
  SECS=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC" | head -1)
  [ "${H:-0}" -gt "${W:-0}" ] && ORIENTATION="portrait"
  MINS=$(awk -v s="${SECS:-60}" 'BEGIN{m=int((s+30)/60); if(m<1)m=1; print m}')
  DURATION="${MINS} min"
fi
if command -v ffmpeg >/dev/null; then
  echo "==> Encoding for web (H.264, fast-start)…"
  ffmpeg -y -v error -i "$SRC" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
    -movflags +faststart -c:a aac -b:a 96k "$MEDIA_DIR/$MP4"
  echo "==> Extracting poster frame…"
  ffmpeg -y -v error -ss 3 -i "$MEDIA_DIR/$MP4" -frames:v 1 -q:v 3 "$MEDIA_DIR/$POSTER"
else
  echo "   (ffmpeg not found — copying the original file as-is, no poster)"
  cp "$SRC" "$MEDIA_DIR/$MP4"; POSTER=""
fi
SIZE_MB=$(du -m "$MEDIA_DIR/$MP4" | cut -f1)
[ "$SIZE_MB" -gt 25 ] && echo "   WARNING: ${SIZE_MB} MB is large for streaming; consider trimming or a higher -crf."

# ---- 3. insert registry entry -------------------------------------------
echo "==> Adding entry to artifacts/humanity-ai-website/src/data/claude-hacks.ts"
ID="$ID" EPISODE="$EPISODE" TITLE="$TITLE" DESC="$DESC" MP4="$MP4" POSTER="$POSTER" \
DURATION="$DURATION" ORIENTATION="$ORIENTATION" FEATURED="$FEATURED" TAGS="$TAGS" \
node - "$DATA_FILE" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
let src = fs.readFileSync(file, "utf8");
const e = process.env;
const q = (s) => JSON.stringify(s);
const tags = e.TAGS.split(",").map((t) => t.trim()).filter(Boolean);
if (e.FEATURED === "true") src = src.replace(/^\s*featured: true,\n/gm, "");
const entry = [
  "  {",
  `    id: ${q(e.ID)},`,
  e.EPISODE ? `    episode: ${q(e.EPISODE)},` : null,
  `    title: ${q(e.TITLE)},`,
  `    description:\n      ${q(e.DESC || "Description coming soon.")},`,
  `    file: ${q(e.MP4)},`,
  e.POSTER ? `    poster: ${q(e.POSTER)},` : null,
  `    duration: ${q(e.DURATION)},`,
  `    orientation: ${q(e.ORIENTATION)},`,
  `    published: ${q(new Date().toISOString().slice(0, 10))},`,
  e.FEATURED === "true" ? "    featured: true," : null,
  `    tags: [${tags.map(q).join(", ")}],`,
  "  },",
].filter(Boolean).join("\n");
const marker = "export const claudeHacksClips: VideoClip[] = [\n";
if (!src.includes(marker)) { console.error("Could not find clip array in " + file); process.exit(1); }
src = src.replace(marker, marker + entry + "\n");
fs.writeFileSync(file, src);
console.log("    added clip id: " + e.ID);
NODE

# ---- 4. next steps -------------------------------------------------------
cat <<EOF

Done. Review the new entry (and edit the description if you like), then ship it:

  git add media/training-videos artifacts/humanity-ai-website/src/data/claude-hacks.ts
  git commit -m "Add Claude Hacks clip: $TITLE"
  git push origin main

GitHub Actions uploads the clip to Blob Storage, rebuilds, and deploys (~5 min):
  https://github.com/dfranklin30/humanity-ai-website/actions
EOF
