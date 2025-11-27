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
CMD ["sh","-c","mkdir -p /uploads/images && mkdir -p /uploads/models && npm run db:migrate && node server.js"]