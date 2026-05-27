FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY turbo.json ./

ARG VITE_API_URL=http://localhost:3001
ARG VITE_FACE_API_URL=http://localhost:8000
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FACE_API_URL=$VITE_FACE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN pnpm turbo run build --filter=@emergensee/web

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
