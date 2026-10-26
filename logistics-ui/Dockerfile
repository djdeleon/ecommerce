FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm install -g npm@latest

RUN chown -R node:node /app
USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
