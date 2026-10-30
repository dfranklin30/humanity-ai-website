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

## The kids platform (`aiforkids` Container App)

The Kids AI Studio runs as its own Container App, **`aiforkids`**, from the same
image with `APP_ROLE=kids`, on **aiforkids.humanityplusai.org**. The website
(`humanity-ai`, `APP_ROLE=site`) redirects `/aiforkids/studio`, `/hub`,
`/facilitator` and `/week/*` there and no longer mounts `/api/aik`. Rationale and
layout: `artifacts/api-server/src/aik/ARCHITECTURE.md`.

One-time creation (Cloud Shell). Secrets are Key Vault references; put the values
in `kv-humanityplusai` first (`aik-anthropic-key`, `aik-aoai-key`,
`aik-safety-key`, `elevenlabs-api-key`, `foundry-api-key`, `database-url`,
`session-secret`). Never paste a secret value into a command that is logged.

```bash
RG=rg-humanityplusai; ENV=cae-humanityplusai; APP=aiforkids
IMG=$(az containerapp show -g $RG -n humanity-ai --query "properties.template.containers[0].image" -o tsv)
KV=https://kv-humanityplusai.vault.azure.net/secrets

az containerapp create -g $RG -n $APP --environment $ENV --image "$IMG" \
  --target-port 8080 --ingress external --min-replicas 1 --max-replicas 3 \
  --cpu 1.0 --memory 2.0Gi --system-assigned \
  --registry-server acrhumanityplusai.azurecr.io --registry-identity system

# the app's identity reads Key Vault, pulls images, writes media, calls Azure OpenAI
PRINCIPAL=$(az containerapp show -g $RG -n $APP --query identity.principalId -o tsv)
az keyvault set-policy -n kv-humanityplusai --object-id $PRINCIPAL --secret-permissions get list
az role assignment create --assignee $PRINCIPAL --role "Storage Blob Data Contributor" \
  --scope $(az storage account show -g $RG -n sthumanityplusai --query id -o tsv)
az role assignment create --assignee $PRINCIPAL --role "Cognitive Services OpenAI User" \
  --scope $(az cognitiveservices account show -g $RG -n aoai-hpai-westus --query id -o tsv)

az containerapp secret set -g $RG -n $APP --secrets \
  database-url=keyvaultref:$KV/database-url,identityref:system \
  session-secret=keyvaultref:$KV/session-secret,identityref:system \
  aik-anthropic-key=keyvaultref:$KV/aik-anthropic-key,identityref:system \
  aik-safety-key=keyvaultref:$KV/aik-safety-key,identityref:system \
  elevenlabs-api-key=keyvaultref:$KV/elevenlabs-api-key,identityref:system \
  foundry-api-key=keyvaultref:$KV/foundry-api-key,identityref:system

az containerapp update -g $RG -n $APP --set-env-vars \
  APP_ROLE=kids NODE_ENV=production APP_ENV=production PORT=8080 \
  APP_URL=https://aiforkids.humanityplusai.org AIK_PUBLIC_URL=https://aiforkids.humanityplusai.org \
  DATABASE_URL=secretref:database-url SESSION_SECRET=secretref:session-secret \
  AIK_ENABLED=true AIK_REQUIRE_CONTENT_SAFETY=true \
  AIK_TEXT_PROVIDER=anthropic AIK_ANTHROPIC_API_KEY=secretref:aik-anthropic-key \
  AIK_ANTHROPIC_MODEL=claude-sonnet-4-5 AIK_ANTHROPIC_FAST_MODEL=claude-haiku-4-5 \
  AIK_AZURE_OPENAI_ENDPOINT=https://aoai-hpai-westus.openai.azure.com/ AIK_AZURE_OPENAI_TEXT_DEPLOYMENT=gpt-4o AIK_AZURE_USE_IDENTITY=true \
  AIK_CONTENT_SAFETY_ENDPOINT=https://danielle-4273-resource.cognitiveservices.azure.com/ AIK_CONTENT_SAFETY_KEY=secretref:aik-safety-key \
  AIK_TTS_PROVIDER=azure AIK_AZURE_SPEECH_KEY=secretref:aik-safety-key AIK_AZURE_SPEECH_REGION=eastus2 \
  AIK_IMAGE_PROVIDER=oss AIK_OSS_IMAGE_BASE_URL=https://danielle-4273-resource.openai.azure.com/openai/v1 AIK_OSS_IMAGE_MODEL=flux2-flex AIK_OSS_IMAGE_API_KEY=secretref:foundry-api-key \
  AIK_VIDEO_PROVIDER=oss AIK_OSS_VIDEO_BASE_URL=https://danielle-4273-resource.openai.azure.com/openai/v1 AIK_OSS_VIDEO_MODEL=sora-2 AIK_OSS_VIDEO_API_KEY=secretref:foundry-api-key \
  AIK_VIDEO_SHOTS=3 AIK_VIDEO_SHOT_SECONDS=8 AIK_VIDEO_SIZE=1280x720 \
  AIK_MUSIC_PROVIDER=elevenlabs AIK_ELEVENLABS_API_KEY=secretref:elevenlabs-api-key \
  AIK_MEDIA_ACCOUNT=sthumanityplusai AIK_MEDIA_CONTAINER=aik-media \
  AIK_CEILING_USER_DAILY=5 AIK_CEILING_ORG_MONTHLY=150

# move the hostname from the website app to the kids app, then the website becomes site-only
az containerapp hostname delete -g $RG -n humanity-ai --hostname aiforkids.humanityplusai.org --yes
az containerapp hostname add  -g $RG -n $APP --hostname aiforkids.humanityplusai.org
az containerapp hostname bind -g $RG -n $APP --hostname aiforkids.humanityplusai.org --environment $ENV --validation-method CNAME
az containerapp update -g $RG -n humanity-ai --set-env-vars APP_ROLE=site KIDS_ORIGIN=https://aiforkids.humanityplusai.org
```

Check: `https://aiforkids.humanityplusai.org/api/aik/config` reports every capability
`ready: true`, `book.illustrated`, `book.narrated` and `movie.ready`; and
`https://humanityplusai.org/aiforkids/studio` answers 301.

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
