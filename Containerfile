# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# BACKEND_URL harus di-pass saat build agar next.config.mjs rewrites() bisa membaca nilainya
# Contoh: podman build --build-arg BACKEND_URL=https://backlaser.pplgsmkn4.my.id .
ARG BACKEND_URL=https://backlaser.pplgsmkn4.my.id
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
