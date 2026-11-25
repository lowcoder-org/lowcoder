FROM node:26.13.1-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
