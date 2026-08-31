FROM node:20-alpine

WORKDIR /lowcoder/proxy-service

RUN apk add --no-cache curl

COPY package.json ./
RUN yarn install || npm install

COPY . .
RUN yarn build || npm run build

EXPOSE 6070

CMD ["node", "build/server.js"]
