FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY turbo.json ./

RUN pnpm turbo run build --filter=@emergensee/api

# Resolve all pnpm symlinks into a real, self-contained node_modules
RUN pnpm --filter @emergensee/api deploy --prod /app/api-deploy

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/api-deploy/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]
