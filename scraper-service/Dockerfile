FROM ghcr.io/puppeteer/puppeteer:24

# Switch to root to install deps (if needed, but puppeteer image comes with node)
USER root

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Puppeteer image runs as 'pptruser' by default, which is good practice.
# But we need to ensure permissions if we copy files as root.
RUN chown -R pptruser:pptruser /app

USER pptruser

EXPOSE 4000

CMD ["node", "index.js"]
