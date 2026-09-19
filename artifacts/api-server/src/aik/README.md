# Kids AI Studio (`/aiforkids/studio`)

A guarded, facilitator-supervised space where children in grades 3–5 direct AI
through purpose-built studios. This folder is the server side; the browser
side lives in `artifacts/humanity-ai-website/src/aiforkids/studio/`.
Design rationale: the *Kids AI Studio — Platform Design Brief* and
*AI Stack and Licensing* docs in the Humanity+AI Claude project.

## Studios (modules)

| Studio | Interaction | Model tier | Output |
|---|---|---|---|
| 🎮 Game Maker | Director's Orders + helper chat | default (Claude) | single-file HTML game in a locked sandbox |
| 📚 Story Maker | Orders + chat | default | six-panel comic script + cover idea |
| 🎨 Prompt Craft | Orders | fast | assembled prompt + image (facilitator-approved) |
| 🧭 Quest Helper | Orders + chat | default | fact list / quiz / outline with "check me" flags |
| 🎬 Video Maker | Orders | default + video model | 3-shot storyboard + ~5 s clip (facilitator-approved) |
| 🤖 Robotics Lab | Orders + chat | default | parts, build steps, micro:bit MakeCode starter code, safety note |
| 📝 Homework Help | chat only | fast | Socratic tutoring, step by step, never just the answer |

Every studio runs through the same pipeline: structured input → PII catcher →
blocklist → Azure AI Content Safety + Prompt Shields → model → output screening
→ code scan (games/robots) → artifact. Media (images, video) is held for
facilitator approval before a child sees it. Chats are turn-limited per session
and every turn is screened both ways and shown on the facilitator dashboard.

## The Hub (`/aiforkids/hub`)

The staff side. One signed-in place where Humanity + AI does its own AI work:
every tool as a no-code form, every result filed under a project, the eight
week modules of *Make It With AI* with their run-sheets, and the way into the
class dashboard.

A **workspace** is a class row with `kind = 'workspace'` and no children — one
per facilitator, created on first visit. Staff requests therefore run the
identical pipeline: PII catcher, blocklist, Content Safety, prompt shields,
output screening, game code scan and audit log all apply to adult work exactly
as they do to a child's. Only the limits differ:

| | Children | Staff Hub |
|---|---|---|
| Modules | only what the facilitator unlocked | all |
| Orders per session | ticket limit (2 by default) | unlimited |
| Field length | 160 chars (`maxFieldChars`) | 1,200 (`staffFieldChars`) |
| Chat length | 300 chars | 4,000 (`staffChatChars`) |
| Images / video | held for facilitator approval | approved on arrival |
| Screening | full | full — identical |

Endpoints live under `/api/aik/hub` and all require a facilitator session.
`aik_projects` groups artifacts; `aik_artifacts.project_id` is the link.
Week modules render at `/aiforkids/week/1..8` and `/aiforkids/hub/week/1..8`,
both behind the same sign-in.

## Turning it on

The Studio is **off** unless `AIK_ENABLED=true`. With it off, nothing under
`/api/aik` is mounted and the pages show "The Studio isn't open right now."

Container App env vars (secrets via Key Vault `secretref`). One organizational
key per provider; children never hold licenses.

| Variable | Purpose |
|---|---|
| `AIK_ENABLED` | `true` to mount the API |
| `AIK_BOOTSTRAP_FACILITATOR` | `email:password` — creates the first (admin) facilitator if none exist. Remove after first sign-in and change the password from the dashboard. |
| **Text (Claude)** | |
| `AIK_TEXT_PROVIDER` | `anthropic` (default when the key is set) · `azure` · `oss` |
| `AIK_ANTHROPIC_API_KEY` | key from the Humanity+AI Anthropic organization |
| `AIK_ANTHROPIC_MODEL` / `AIK_ANTHROPIC_FAST_MODEL` | default `claude-sonnet-4-5` / `claude-haiku-4-5` (fast tier: chat turns, Homework Help, Prompt Craft) |
| **Open-source text** (any OpenAI-compatible endpoint: Azure AI Foundry MaaS, Groq, Together, Fireworks, OpenRouter, self-hosted vLLM) | |
| `AIK_OSS_BASE_URL`, `AIK_OSS_API_KEY`, `AIK_OSS_MODEL` | e.g. Foundry endpoint + `Llama-4-Maverick` / `gpt-oss-120b` / `Qwen3` |
| `AIK_OSS_TEXT_PROVIDER` | which provider serves modules marked `tier: "oss"` (default `oss` when configured) |
| **Images** | |
| `AIK_IMAGE_PROVIDER` | `azure`, `oss` (Azure AI Foundry / any OpenAI-compatible images endpoint) or `fal` |
| `AIK_OSS_IMAGE_BASE_URL`, `AIK_OSS_IMAGE_API_KEY`, `AIK_OSS_IMAGE_MODEL` | open-source image model, e.g. a Foundry FLUX.1 deployment. Falls back to the `AIK_OSS_*` text endpoint and key when not set separately. |
| `AIK_AZURE_OPENAI_ENDPOINT`, `AIK_AZURE_OPENAI_API_KEY`, `AIK_AZURE_OPENAI_IMAGE_DEPLOYMENT`, (`AIK_AZURE_OPENAI_TEXT_DEPLOYMENT`, `AIK_AZURE_OPENAI_API_VERSION`) | Azure OpenAI |
| `AIK_FAL_KEY`, `AIK_FAL_IMAGE_MODEL` (default `fal-ai/flux/schnell`) | fal.ai |
| **Video** | |
| `AIK_VIDEO_PROVIDER` | `fal` or `none` |
| `AIK_FAL_VIDEO_MODEL` | default `fal-ai/ltx-video` (open-source text-to-video). Verify the model id on fal.ai before enabling. |
| **Music / voice** | |
| `AIK_MUSIC_PROVIDER` | `elevenlabs`, `fal` (`AIK_FAL_MUSIC_MODEL`, default `fal-ai/stable-audio`) or `none` |
| `AIK_TTS_PROVIDER` | `azure` (Azure AI Speech) · `elevenlabs` · `none` |
| `AIK_AZURE_SPEECH_KEY`, `AIK_AZURE_SPEECH_REGION`, `AIK_AZURE_SPEECH_VOICE` | Azure AI Speech. **The same multi-service AIServices resource that serves Content Safety also serves Speech**, so "Read it to me" needs no new vendor — reuse that key and its region. Default voice `en-US-AvaMultilingualNeural`. |
| `AIK_ELEVENLABS_API_KEY`, `AIK_ELEVENLABS_VOICE_ID` | ElevenLabs alternative |
| **Screening** | |
| `AIK_CONTENT_SAFETY_ENDPOINT`, `AIK_CONTENT_SAFETY_KEY` | Azure AI Content Safety |
| `AIK_REQUIRE_CONTENT_SAFETY` | default `true` in production: fail closed |
| `AIK_MOCK_AI` | `true` returns canned results, non-production only |

Anthropic's *Guidelines for organizations serving minors* apply when Claude is
the provider: age gating, content moderation, monitoring/reporting, AI
disclosure, and a public COPPA compliance statement. The Studio implements the
first four (roster + consent gate, Content Safety + blocklist, dashboard + audit
log, disclosure text on the sign-in and chat screens); the public statement
belongs at `/aiforkids/privacy`.

## Files

- `config.ts` — env, provider selection by capability, limits
- `ai.ts` — provider adapters: Anthropic, OpenAI-compatible (OSS), Azure OpenAI, fal.ai queue, ElevenLabs
- `store.ts` — Postgres tables (`aik_*`, additive `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`)
- `safety.ts` — PII catcher, blocklist, Content Safety + Prompt Shields, output screening, code scan, CSP hardening
- `modes.ts` — the seven studios: fields, personas, system prompts, output parsing
- `pipeline.ts` — request lifecycle (orders and chat turns), media approval gate, live-feed bus
- `routes.ts` — HTTP API under `/api/aik`

## Local test

```
AIK_ENABLED=true AIK_MOCK_AI=true AIK_REQUIRE_CONTENT_SAFETY=false \
AIK_BOOTSTRAP_FACILITATOR="you@example.org:a-long-test-password" \
DATABASE_URL=... SESSION_SECRET=... PORT=8080 node dist/index.mjs
```

Sign in at `/aiforkids/facilitator`, create a class, add a child with a PIN and
record consent, unlock studios, then sign the child in at `/aiforkids/studio`.

## Privacy rules baked in

Child rows hold nickname, avatar, PIN hash, consent flag and class only. Never
add a column for a legal name, email, birth date, photo, voice or address.
Children cannot sign in until consent is recorded. Every order, chat turn,
result and facilitator action is logged in `aik_audit`; a facilitator can
export or permanently delete a class from the dashboard. Children's voices are
never recorded; read-aloud is one-way.
