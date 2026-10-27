FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Use --legacy-peer-deps to prevent strict resolution crashes
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

RUN chown -R node:node /app
USER node

COPY --chown=node:node . .

EXPOSE 8000

CMD ["npm", "run", "dev"]