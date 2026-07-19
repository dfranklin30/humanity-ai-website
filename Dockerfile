# ---------- Build stage ----------
FROM node:24-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the whole workspace (source only — .dockerignore trims the rest)
COPY . .

# Install deps for the website + API server and everything they depend on
RUN pnpm install --no-frozen-lockfile \
    --filter "@workspace/api-server..." \
    --filter "@workspace/humanity-ai-website..."

# Build shared lib packages (tsc project references)
RUN pnpm exec tsc --build

# Build the website (static bundle)
RUN BASE_PATH=/ PORT=8080 pnpm --filter "@workspace/humanity-ai-website" run build

# Build the API server (esbuild bundle -> dist/index.mjs)
RUN pnpm --filter "@workspace/api-server" run build

# The API server serves the website from dist/public
RUN cp -r artifacts/humanity-ai-website/dist/public artifacts/api-server/dist/public

# ---------- Runtime stage ----------
FROM node:24-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Only the two packages the server bundle loads at runtime (native/dynamic deps)
RUN npm install --omit=dev --no-audit --no-fund sharp@0.35.3 nodemailer@9.0.3

COPY --from=build /app/artifacts/api-server/dist ./dist

# Legacy blog/site images served at /uploads/* (videos are excluded via .dockerignore)
COPY --from=build /app/attached_assets ./attached_assets

# Uploads directory (mounted as a Cloud Storage volume in production)
RUN mkdir -p /app/uploads/avatars /app/uploads/posts

EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
