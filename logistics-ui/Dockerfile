FROM node:24-bookworm-slim

# Install system dependencies needed for Playwright & Headless Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure the directory belongs to node before doing anything
RUN chown -R node:node /app

USER node

# Copy package files as the node user
COPY --chown=node:node package*.json ./

# Run clean install
RUN npm install

# Copy the rest of your local files
COPY --chown=node:node . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=development

CMD ["npm", "run", "dev"]