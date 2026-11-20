FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile --filter api... --filter @symma/database...
RUN pnpm --filter @symma/database exec prisma generate
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod /prod/api

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod/api ./
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma

# The Prisma CLI is pinned to the installed client so `prisma migrate deploy` and the generated client never drift.
RUN npm install --global "prisma@$(node -p "require('@prisma/client/package.json').version")" \
    && prisma generate --schema prisma/schema.prisma \
    && npm cache clean --force

USER node
EXPOSE 4001

CMD ["sh", "-c", "prisma migrate deploy --schema prisma/schema.prisma && exec node dist/src/main.js"]
