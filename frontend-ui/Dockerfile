FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Set container environment flags
ENV NODE_ENV=development
ENV VITE_ROOT=/app

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
