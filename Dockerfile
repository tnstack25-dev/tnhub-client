# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-only placeholders. Real credentials are supplied to the running container.
RUN API_URL=http://api:3000/api/v1 \
    NEXTAUTH_URL=https://pm.tnstack.com \
    NEXTAUTH_SECRET=build-only-placeholder-never-use-in-production \
    AUTH_INTERNAL_SECRET=build-only-placeholder-never-use-in-production \
    npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=5173
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 5173
CMD ["node", "server.js"]
