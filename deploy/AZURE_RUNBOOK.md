# humanityplusai.org on Azure — deploy & content runbook

_The Google Cloud files in this folder (`deploy.sh`, `MIGRATION_GUIDE.md`) are from an
earlier plan and are not used. Production runs on Azure as described here._

## How the site is hosted

| Piece | Azure resource | Notes |
|---|---|---|
| Website + API | Container App **`humanity-ai`** (env `cae-humanityplusai`) | Resource group `rg-humanityplusai`, East US |
| Container images | Container Registry **`acrhumanityplusai`** | Image `humanity-ai:<tag>`; app pulls with managed identity |
| Video clips + posters | Storage account **`sthumanityplusai`**, container **`training-videos`** | Public read (blob). Source of truth is `media/training-videos/` in this repo; the deploy workflow syncs it up |
| Database | `pg-humanityplusai` (PostgreSQL flexible server) | unchanged by deploys |
| Secrets | `kv-humanityplusai` | unchanged by deploys |

Public URL: https://humanityplusai.org (custom domain on the Container App).
Subscription: `Azure subscription 1` (`33680346-29fc-4366-845d-a04681b59a52`).

## Deploys (automatic)

Every push to `main` runs `.github/workflows/deploy-azure.yml`:

1. syncs `media/training-videos/` to the public `training-videos` blob container
   (creates the container and enables blob public access on the account if needed)
2. builds the Docker image from `Dockerfile` (`media/` is excluded via `.dockerignore`)
3. pushes it to `acrhumanityplusai.azurecr.io/humanity-ai:<date>-<sha>` (and `:latest`)
4. runs `az containerapp update` to point `humanity-ai` at the new image
5. smoke-tests `/training` for a 200

Watch it at https://github.com/dfranklin30/humanity-ai-website/actions. A deploy takes
about 5 minutes. To redeploy without a code change use **Run workflow** on that page.

### One-time setup for the workflow (already done)

The workflow signs in to Azure with **federated credentials (OIDC)** — there is no
password or secret stored in GitHub. Trust is established by a federated credential on
the `gh-humanity-ai-deploy` app registration that only accepts tokens issued to this
repository's `main` branch:

```bash
az ad app federated-credential create --id f36dc42d-759d-49d5-a86f-2cd56955c940 \
  --parameters '{"name":"github-main","issuer":"https://token.actions.githubusercontent.com","subject":"repo:dfranklin30/humanity-ai-website:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}'
```

That identity holds two roles: **Contributor** on `rg-humanityplusai` (to build/deploy)
and **Storage Blob Data Contributor** on `sthumanityplusai` (to upload video clips).

If the repo is ever renamed, or deploys should run from another branch, add a matching
federated credential for the new `subject` value.

### Rollback

Portal → Container App `humanity-ai` → **Revisions and replicas** → pick the previous
revision → **Activate** and send it 100 % of traffic. Or, in Cloud Shell:

```bash
az containerapp revision list -n humanity-ai -g rg-humanityplusai -o table
az containerapp ingress traffic set -n humanity-ai -g rg-humanityplusai \
  --revision-weight <previous-revision-name>=100
```

## Publishing a new Claude Hacks clip

Two places change: the video file goes into `media/training-videos/`, and one entry is
added to `artifacts/humanity-ai-website/src/data/claude-hacks.ts`. The Learning Hub
module card and the homepage teaser both render from that file — nothing else to edit.
Push to `main` and the workflow uploads the clip and redeploys.

### Fast path (script)

Needs only node (already installed for the site). Install ffmpeg (`brew install ffmpeg`)
so clips are web-optimized and get a poster frame automatically.

```bash
scripts/publish-clip.sh ~/Downloads/claude_hacks_ep04.mp4 "Claude Hacks: Drafting Grant Reports" \
  --episode "Ep. 04" \
  --desc "How we turn a folder of notes into a first-draft grant report in one Cowork task." \
  --tags "Claude,Cowork,Grants" \
  --featured

git add media/training-videos artifacts/humanity-ai-website/src/data/claude-hacks.ts
git commit -m "Add Claude Hacks Ep. 04"
git push origin main
```

`--featured` makes this the clip shown on the homepage (the previous featured flag is
cleared). Omit it for a short that should only appear on the Training page.

### Manual path (no script)

1. Copy the `.mp4` (and a `.jpg` poster frame if you have one) into
   `media/training-videos/`. Keep file names lowercase with dashes, e.g.
   `claude-hacks-ep04.mp4`.
2. Open `artifacts/humanity-ai-website/src/data/claude-hacks.ts` and add an entry at the
   top of `claudeHacksClips` — copy the shape of an existing one. `file` and `poster` are
   the exact file names from step 1.
3. Commit and push to `main`.

### Emergency path (portal only, no deploy)

If you need to swap a video file without a code change: Portal → Storage account
`sthumanityplusai` → Containers → `training-videos` → Upload (tick *Overwrite*). Then also
drop the same file into `media/training-videos/` so the next deploy doesn't undo it.

### Tips

- Keep clips under ~10 MB where you can (H.264, `-crf 24`, `-movflags +faststart`);
  they stream directly from storage, so a large file means a slow first frame.
- Portrait (9:16) clips are fine — set `orientation: "portrait"` and the card adapts.
- The Training card's duration/clip count update themselves from the list.
- Deleting a clip: remove the entry and push. The sync never deletes blobs, so remove the
  old file from `media/` too and, if you care, delete the blob in the portal.
- Clips are committed to git so the repo grows by each clip's size. At ~5–10 MB per clip
  that's fine for years; if it ever bothers you, switch `publish-clip.sh` to upload
  directly with `az storage blob upload` and stop committing the files.

## Local development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev      # API on :5000
pnpm --filter @workspace/humanity-ai-website run dev
pnpm run typecheck                               # before you push
```
