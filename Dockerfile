# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install --force

COPY . .

# Accept the API key as a build argument
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ARG GOOGLE_CLOUD_PROJECT
ENV GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT

ARG GOOGLE_CLOUD_LOCATION
ENV GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION

RUN echo "Building frontend..." && npm run build
RUN echo "Building server..." && npm run build:server

# Production Stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps || npm install --omit=dev --force

COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist-server/index.js"]
