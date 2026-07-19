#!/usr/bin/env bash
# ============================================================
# Deploys the Humanity + AI website to Google Cloud Run.
# Run from the project root in Google Cloud Shell:
#   bash deploy/deploy.sh
# Safe to re-run — each run deploys a new revision.
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f deploy/env.deploy ]; then
  echo "ERROR: deploy/env.deploy not found."
  echo "Copy deploy/env.deploy.example to deploy/env.deploy and fill it in first."
  exit 1
fi

# Load settings
set -a
source deploy/env.deploy
set +a

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID in deploy/env.deploy}"
: "${GCP_REGION:?Set GCP_REGION in deploy/env.deploy}"
: "${DATABASE_URL:?Set DATABASE_URL in deploy/env.deploy}"
: "${SESSION_SECRET:?Set SESSION_SECRET in deploy/env.deploy}"

SERVICE_NAME=humanity-ai
BUCKET_NAME="${GCP_PROJECT_ID}-uploads"

echo "==> Using project: $GCP_PROJECT_ID (region $GCP_REGION)"
gcloud config set project "$GCP_PROJECT_ID" --quiet

echo "==> Enabling required Google Cloud services (first run takes a minute)..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com storage.googleapis.com --quiet

echo "==> Creating uploads bucket (kept private; served through the app)..."
if ! gcloud storage buckets describe "gs://$BUCKET_NAME" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET_NAME" --location="$GCP_REGION" --quiet
fi

# Write env vars to a YAML file (handles special characters safely)
ENV_FILE=$(mktemp /tmp/envvars.XXXXXX.yaml)
trap 'rm -f "$ENV_FILE"' EXIT
python3 - "$ENV_FILE" <<'PYEOF'
import os, sys, json
keys = [
    "APP_URL", "DATABASE_URL", "SESSION_SECRET",
    "AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL",
    "STRIPE_SECRET_KEY",
    "GMAIL_USER", "GMAIL_APP_PASSWORD", "EVENT_ADMIN_EMAIL",
    "SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID",
]
out = {"NODE_ENV": "production", "APP_ENV": "production"}
for k in keys:
    v = os.environ.get(k, "").strip()
    if v:
        out[k] = v
with open(sys.argv[1], "w") as f:
    for k, v in out.items():
        f.write(f"{k}: {json.dumps(v)}\n")
PYEOF

echo "==> Building and deploying to Cloud Run (5-10 minutes on first run)..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --env-vars-file "$ENV_FILE" \
  --add-volume "name=uploads,type=cloud-storage,bucket=${BUCKET_NAME}" \
  --add-volume-mount "volume=uploads,mount-path=/app/uploads" \
  --quiet

URL=$(gcloud run services describe "$SERVICE_NAME" --region "$GCP_REGION" --format='value(status.url)')
echo ""
echo "============================================================"
echo "  Deployed! Your site is live at:"
echo "  $URL"
echo "============================================================"
echo "Next: test that URL, then map humanityplusai.org to it."
