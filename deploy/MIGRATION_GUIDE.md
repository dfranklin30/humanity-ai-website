# Moving humanityplusai.org from Replit to Google Cloud

This guide goes with the prepared bundle `Humanity-AI-GoogleCloud.tgz`.
The code inside has already been adapted for Google Cloud — every step below
is either "create an account", "copy a key", or "paste a command".

**The old Replit site keeps running the whole time. Nothing switches over
until the very last step (pointing the domain), and only after the new site
is tested.**

---

## What the new setup looks like

| Piece | Where it runs | Cost |
|---|---|---|
| Website + API | Google Cloud Run | $0 (free tier) |
| Database (PostgreSQL) | Neon free tier | $0 |
| Uploaded images | Google Cloud Storage | $0 (free tier, 5 GB) |
| AI chat | Google Gemini API free tier | $0 |
| Donations | Your existing Stripe account | unchanged |
| Emails | Your existing Gmail app password | unchanged |
| Community feed | Slack bot token | $0 |

## Step 1 — Accounts (10 min)

1. **Google Cloud**: go to https://console.cloud.google.com and sign in with
   your Google account. Accept the terms. If asked to start a free trial,
   that's fine (it includes $300 credit; the site fits the permanent free
   tier anyway).
2. In the top bar click the project dropdown → **New project** → name it
   `humanity-plus-ai` → Create. Note the **Project ID** it shows (it may add
   numbers, e.g. `humanity-plus-ai-448202`).
3. **Neon** (database): go to https://neon.tech → Sign up with Google →
   create a project called `humanity-ai`, region **US East (N. Virginia)**.
   On the dashboard click **Connect** and copy the **connection string**
   (starts with `postgresql://`). Save it in a note.

## Step 2 — Keys (15 min)

Collect these into a note as you go:

1. **Replit database URL**: in Replit open your project → Tools →
   **Secrets** → copy the value of `DATABASE_URL`.
2. **Gemini AI key**: https://aistudio.google.com/apikey → Create API key.
3. **Stripe live key**: https://dashboard.stripe.com/apikeys → copy the
   **Secret key** (`sk_live_...`).
4. **Gmail**: copy `GMAIL_USER` and `GMAIL_APP_PASSWORD` from Replit
   Secrets (same values, reused).
5. **Slack bot token**: https://api.slack.com/apps → **Create New App** →
   From scratch → name `Humanity AI Website`, pick your workspace →
   left menu **OAuth & Permissions** → under *Bot Token Scopes* add:
   `channels:history`, `channels:read`, `users:read` →
   click **Install to Workspace** → copy the **Bot User OAuth Token**
   (`xoxb-...`). Finally, in Slack, open #all-humanityplusai and type
   `/invite @Humanity AI Website`.

## Step 3 — Open Cloud Shell and upload the bundle (5 min)

1. In https://console.cloud.google.com click the **>_** icon (top right) —
   this opens **Cloud Shell**, a small terminal in your browser. Everything
   else happens here; nothing is installed on your computer.
2. Click the **⋮** (three dots) in the Cloud Shell toolbar → **Upload** →
   choose `Humanity-AI-GoogleCloud.tgz`.
3. Unpack it:

   ```bash
   tar -xzf Humanity-AI-GoogleCloud.tgz && cd Humanity-AI-Ecosystem
   ```

## Step 4 — Copy your data from Replit to Neon (5 min)

```bash
bash deploy/migrate-database.sh
```

It asks for the old Replit URL, then the new Neon URL (from steps 1–2),
copies everything, and prints a table of row counts so you can see your
users, blog posts, donations, and events made it. It also leaves a backup
file — download it for safekeeping (Cloud Shell ⋮ → Download).

## Step 5 — Fill in settings and deploy (15 min)

```bash
cp deploy/env.deploy.example deploy/env.deploy
nano deploy/env.deploy      # or: edit deploy/env.deploy  (opens an editor)
```

Fill in each blank value from your notes. For `SESSION_SECRET` run
`openssl rand -hex 32` and paste the result. Save (in nano: Ctrl+O, Enter,
Ctrl+X). Then:

```bash
bash deploy/deploy.sh
```

First deploy takes 5–10 minutes. At the end it prints a URL like
`https://humanity-ai-xxxxx-ue.a.run.app` — open it. **That is your site,
live on Google Cloud.** Test it: browse pages, log in, open the blog.

## Step 6 — Point humanityplusai.org at Google Cloud

Only after Step 5 looks good:

```bash
gcloud beta run domain-mappings create --service humanity-ai \
  --domain humanityplusai.org --region us-east1
```

It prints DNS records (A and AAAA). Add those at your domain registrar
(wherever you bought humanityplusai.org), replacing the old Replit records.
DNS takes minutes to a few hours; HTTPS certificates are automatic.
Once https://humanityplusai.org loads the new site, the migration is done —
you can cancel the Replit deployment (keep the Repl itself as a backup for
a few weeks).

## If something goes wrong

- Deploy logs: `gcloud run services logs read humanity-ai --region us-east1`
- Re-running `bash deploy/deploy.sh` is always safe.
- Nothing in these steps touches the running Replit site.
