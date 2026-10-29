FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

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
