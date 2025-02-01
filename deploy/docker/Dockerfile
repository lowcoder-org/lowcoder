##
## Build Lowcoder api-service application
##
FROM maven:3.9-eclipse-temurin-17 AS build-api-service

# Build lowcoder-api
COPY ./server/api-service /lowcoder-server
WORKDIR /lowcoder-server
RUN --mount=type=cache,target=/root/.m2 mvn -f pom.xml clean package -DskipTests

# Create required folder structure
RUN mkdir -p /lowcoder/api-service/config /lowcoder/api-service/logs /lowcoder/plugins

# Copy lowcoder server configuration
COPY server/api-service/lowcoder-server/src/main/resources/application.yaml /lowcoder/api-service/config/

# Add bootstrapfile
COPY deploy/docker/api-service/entrypoint.sh /lowcoder/api-service/entrypoint.sh
COPY deploy/docker/api-service/init.sh /lowcoder/api-service/init.sh
ENV JAVA_OPTS="-Xmx2G -Xms512M"
RUN chmod +x /lowcoder/api-service/*.sh

##
## Intermediary Lowcoder api-service image
##
## To create a separate image out of it, build it with:
##   DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-api-service --target lowcoder-ce-api-service .
##
FROM eclipse-temurin:17-jammy AS lowcoder-ce-api-service
LABEL maintainer="lowcoder"

RUN apt-get update && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/cache/apt/lists \
  && addgroup --system --gid 9001 lowcoder \
  && adduser --system --disabled-password --no-create-home --uid 9001 --gid 9001 lowcoder


# Copy lowcoder server configuration
COPY --chown=lowcoder:lowcoder --from=build-api-service /lowcoder/api-service /lowcoder/api-service

# Copy lowcoder api service app, dependencies and libs
COPY --chown=lowcoder:lowcoder --from=build-api-service /lowcoder-server/lowcoder-server/target/lowcoder-api-service-bin/lowcoder-api-service.jar /lowcoder/api-service/lowcoder-api-service.jar
COPY --chown=lowcoder:lowcoder --from=build-api-service /lowcoder-server/lowcoder-server/target/lowcoder-api-service-bin/libs /lowcoder/api-service/libs
COPY --chown=lowcoder:lowcoder --from=build-api-service /lowcoder-server/lowcoder-server/target/lowcoder-api-service-bin/plugins /lowcoder/api-service/plugins

EXPOSE 8080
CMD [ "/bin/bash" , "/lowcoder/api-service/entrypoint.sh" ]

#############################################################################

##
## Build lowcoder node service
##
FROM ubuntu:jammy AS build-node-service

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates build-essential gnupg

# Add nodejs repo and keys
RUN mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# Download nodejs and install yarn
RUN apt-get update \
  && apt-get install --no-install-recommends -y nodejs \
  && npm install -g yarn

# Copy and build the node-service app
COPY server/node-service/ /lowcoder/node-service/app/
WORKDIR /lowcoder/node-service/app/
RUN yarn --immutable
RUN yarn build

# Copy startup script
COPY deploy/docker/node-service/entrypoint.sh /lowcoder/node-service/entrypoint.sh
COPY deploy/docker/node-service/init.sh /lowcoder/node-service/init.sh
RUN chmod +x /lowcoder/node-service/*.sh

##
## Intermediary Lowcoder node service image
##
## To create a separate image out of it, build it with:
##   DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-node-service --target lowcoder-ce-node-service .
##
FROM ubuntu:jammy AS lowcoder-ce-node-service
LABEL maintainer="lowcoder"

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates gnupg

# Add nodejs repo and keys
RUN mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# Download nodejs and install yarn
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y nodejs gosu \
  && npm install -g yarn \
  && rm -rf /var/cache/apt/lists \
  && addgroup --system --gid 9001 lowcoder \
  && adduser --system --disabled-password --no-create-home --uid 9001 --gid 9001 lowcoder

COPY --from=build-node-service /lowcoder/node-service /lowcoder/node-service

EXPOSE 6060
CMD [ "/bin/sh", "/lowcoder/node-service/entrypoint.sh" ]

#############################################################################

##
## Build lowcoder client application
##
FROM node:23.7-slim AS build-client

# curl is required for yarn build to succeed, because it calls it while building client
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Build client
COPY ./client /lowcoder-client
WORKDIR /lowcoder-client
RUN yarn --immutable

ARG REACT_APP_COMMIT_ID=test
ARG REACT_APP_ENV=production
ARG REACT_APP_EDITION=community
ARG REACT_APP_DISABLE_JS_SANDBOX=true
RUN yarn build

# Build lowcoder-comps
WORKDIR /lowcoder-client/packages/lowcoder-comps
RUN yarn install
RUN yarn build
RUN tar -zxf lowcoder-comps-*.tgz && mv package lowcoder-comps

# Build lowcoder-sdk
WORKDIR /lowcoder-client/packages/lowcoder-sdk
RUN yarn install
RUN yarn build

WORKDIR /lowcoder-client/packages/lowcoder-sdk-webpack-bundle
RUN yarn install
RUN yarn build

##
## Intermediary Lowcoder client image
##
## To create a separate image out of it, build it with:
##   DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-frontend --target lowcoder-ce-frontend .
##
FROM nginx:1.27.1 AS lowcoder-ce-frontend
LABEL maintainer="lowcoder"

# Change default nginx user into lowcoder user and remove default nginx config
RUN usermod --login lowcoder --uid 9001 nginx \
  && groupmod --new-name lowcoder --gid 9001 nginx \
  && rm -f /etc/nginx/nginx.conf \
  && mkdir -p /lowcoder/assets

# Copy lowcoder client
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder/build/ /lowcoder/client
# Copy lowcoder components
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-comps/lowcoder-comps /lowcoder/client-comps
# Copy lowcoder SDK
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-sdk /lowcoder/client-sdk
# Copy lowcoder SDK webpack bundle
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-sdk-webpack-bundle/dist /lowcoder/client-embed


# Copy additional nginx init scripts
COPY deploy/docker/frontend/00-change-nginx-user.sh /docker-entrypoint.d/00-change-nginx-user.sh
COPY deploy/docker/frontend/01-update-nginx-conf.sh /docker-entrypoint.d/01-update-nginx-conf.sh

RUN chmod +x /docker-entrypoint.d/00-change-nginx-user.sh && \
    chmod +x /docker-entrypoint.d/01-update-nginx-conf.sh

COPY deploy/docker/frontend/server.conf /etc/nginx/server.conf
COPY deploy/docker/frontend/nginx-http.conf /etc/nginx/nginx-http.conf
COPY deploy/docker/frontend/nginx-https.conf /etc/nginx/nginx-https.conf
COPY deploy/docker/frontend/ssl-certificate.conf /etc/nginx/ssl-certificate.conf
COPY deploy/docker/frontend/ssl-params.conf /etc/nginx/ssl-params.conf


EXPOSE 3000
EXPOSE 3443

#############################################################################

##
## Build Lowcoder all-in-one image
##
FROM ubuntu:jammy
LABEL maintainer="lowcoder"

# Install essential tools
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates gnupg bash lsb-release \
  && rm -rf /var/cache/apt/lists /var/lib/apt/lists/* /var/log/dpkg.log \
  && apt-get clean

# Add required apt repositories and signing keys
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/nodesource-keyring.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
  && curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb `lsb_release -cs` main" | tee /etc/apt/sources.list.d/redis.list \
  && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg] https://repo.mongodb.org/apt/ubuntu `lsb_release -cs`/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
  && curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/ubuntu `lsb_release -cs` nginx" | tee /etc/apt/sources.list.d/nginx.list


# Install required packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install --no-install-recommends -y \
      nginx=1.27.1-1~jammy \
      mongodb-org \
      redis \
      supervisor \
      gosu \
      nodejs \
      openjdk-17-jdk-headless \
  && npm install -g yarn \
  && rm -rf /var/cache/apt/lists /var/lib/apt/lists/* /var/log/dpkg.log \
  && apt-get clean \
  && rm -rf /tmp/*

# Use configuration setup from official nginx image
RUN rm -rf /etc/nginx/nginx.conf
COPY --from=nginx:1.27.1 /docker-entrypoint.d /docker-entrypoint.d
COPY --from=nginx:1.27.1 /docker-entrypoint.sh /docker-entrypoint.sh

# Add lowcoder user
RUN usermod --login lowcoder --uid 9001 nginx \
  && groupmod --new-name lowcoder --gid 9001 nginx

# Copy additional nginx init scripts and configs
COPY --chmod=0755 deploy/docker/frontend/00-change-nginx-user.sh /docker-entrypoint.d/00-change-nginx-user.sh
COPY --chmod=0755 deploy/docker/frontend/01-update-nginx-conf.sh /docker-entrypoint.d/01-update-nginx-conf.sh
COPY deploy/docker/frontend/server.conf /etc/nginx/server.conf
COPY deploy/docker/frontend/nginx-http.conf /etc/nginx/nginx-http.conf
COPY deploy/docker/frontend/nginx-https.conf /etc/nginx/nginx-https.conf
COPY deploy/docker/frontend/ssl-certificate.conf /etc/nginx/ssl-certificate.conf
COPY deploy/docker/frontend/ssl-params.conf /etc/nginx/ssl-params.conf


# Add lowcoder frontend
#    copy lowcoder client
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder/build/ /lowcoder/client
#    copy lowcoder components
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-comps/lowcoder-comps /lowcoder/client-comps
#    copy lowcoder SDK
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-sdk /lowcoder/client-sdk
#    copy lowcoder SDK webpack bundle
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder-sdk-webpack-bundle/dist /lowcoder/client-embed
RUN mkdir -p /lowcoder/assets/ && chown lowcoder:lowcoder /lowcoder/assets/

# Add lowcoder api-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-api-service /lowcoder/api-service /lowcoder/api-service
RUN mkdir -p /lowcoder/plugins/ && chown lowcoder:lowcoder /lowcoder/plugins/

# Add lowcoder node-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-node-service /lowcoder/node-service /lowcoder/node-service

# Add services configuration
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/etc /lowcoder/etc

# Add startup script
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/entrypoint.sh /lowcoder/entrypoint.sh

# Fixes for OpenShift compatibility (after all files are copied)
RUN echo  \
  && adduser lowcoder root \
  && mkdir -p /lowcoder-stacks \
  && for i in /lowcoder-stacks /lowcoder/assets /lowcoder/api-service/logs /lowcoder/etc/supervisord; do \
       chmod -R g+rw "$i"; \
       chown -R lowcoder:root "$i"; \
     done \
  && chown -R lowcoder:root /var/log \
  && chmod -R g+rw /run /etc/nginx /var/cache/nginx /var/log

EXPOSE 27017
EXPOSE 3000
EXPOSE 3443

ENTRYPOINT [ "/bin/sh" , "/lowcoder/entrypoint.sh" ]
CMD ["/usr/bin/supervisord", "-n" , "-c" , "/lowcoder/etc/supervisord.conf"]

