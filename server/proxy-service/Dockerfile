# Node 26 images ship neither Yarn nor corepack
FROM node:26.13.1-alpine AS build

WORKDIR /lowcoder/proxy-service

RUN npm install -g yarn@1.22.22

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build


FROM node:26.13.1-alpine

WORKDIR /lowcoder/proxy-service

RUN apk add --no-cache curl
RUN npm install -g yarn@1.22.22

# Only the production dependencies and the built output reach the final image
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /lowcoder/proxy-service/build ./build

EXPOSE 6070

CMD ["node", "build/server.js"]
