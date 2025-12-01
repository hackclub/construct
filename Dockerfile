FROM node:22-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
ENV DATABASE_HOST=localhost
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-bullseye-slim
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
COPY drizzle.config.ts .
COPY drizzle ./drizzle
COPY server.js .
ENV DATABASE_HOST=localhost
ENV BODY_SIZE_LIMIT=80M
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["sh","-c","mkdir -p /uploads/images && mkdir -p /uploads/models && npm run db:migrate && node server.js"]