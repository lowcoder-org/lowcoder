FROM node:26.13.1-alpine

WORKDIR /lowcoder/proxy-service

RUN apk add --no-cache curl
# Node 26 images ship neither Yarn nor corepack
RUN npm install -g yarn@1.22.22

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build
RUN rm -rf node_modules && yarn install --frozen-lockfile --production && yarn cache clean

EXPOSE 6070

CMD ["node", "build/server.js"]
