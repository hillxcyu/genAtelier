# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept the API key as a build argument
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ARG GOOGLE_CLOUD_PROJECT
ENV GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT

ARG GOOGLE_CLOUD_LOCATION
ENV GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION

RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
