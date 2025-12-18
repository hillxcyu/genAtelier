FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm run build:server

# Production stage
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev

COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist-server/index.js"]
