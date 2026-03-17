# Use Node version 20
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "backend/transaction-api-server/server.js"]
