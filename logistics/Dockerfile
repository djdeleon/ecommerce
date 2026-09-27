FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN chown -R node:node /app
USER node
RUN npm install

COPY --chown=node:node . .

EXPOSE 8000

CMD ["npm", "run", "dev"]