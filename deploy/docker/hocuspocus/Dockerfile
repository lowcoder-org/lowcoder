# Hocuspocus (Yjs WebSocket) server for lowcoder ChatBox.
# Build context: client/packages/lowcoder (see Dockerfile.dockerignore next to this file)
FROM node:26-alpine

ARG HOCUSPOCUS_SERVER_VERSION=4.3.0

RUN mkdir -p /app/ && chown node: /app/

COPY --chown=node:node hocuspocus-server.js /app/

WORKDIR /app
USER node

# hocuspocus-server.js uses ESM imports; declare the package type so Node does not reparse it
RUN npm install --save-exact @hocuspocus/server@${HOCUSPOCUS_SERVER_VERSION} \
    && npm pkg set type=module

EXPOSE 3006

CMD ["node", "hocuspocus-server.js"]
