##
## Build Lowcoder api-service application
##
FROM maven:3.9-eclipse-temurin-17 AS build-api-service
COPY ./server/api-service /lowcoder-server
WORKDIR /lowcoder-server
RUN --mount=type=cache,target=/root/.m2 mvn -f pom.xml clean package -DskipTests

# Create required folder structure
RUN mkdir -p /lowcoder/api-service/plugins /lowcoder/api-service/config /lowcoder/api-service/logs

# Define lowcoder main jar and plugin jars
ARG JAR_FILE=/lowcoder-server/lowcoder-server/target/lowcoder-server-*.jar
ARG PLUGIN_JARS=/lowcoder-server/lowcoder-plugins/*/target/*.jar

# Copy lowcoder server application and plugins
RUN cp ${JAR_FILE} /lowcoder/api-service/server.jar \
  && cp ${PLUGIN_JARS} /lowcoder/api-service/plugins/

# Copy lowcoder server configuration
COPY server/api-service/lowcoder-server/src/main/resources/selfhost/ce/application.yml /lowcoder/api-service/config/
COPY server/api-service/lowcoder-server/src/main/resources/selfhost/ce/application-selfhost.yml /lowcoder/api-service/config/

# Add bootstrapfile
COPY deploy/docker/api-service/entrypoint.sh /lowcoder/api-service/entrypoint.sh
COPY deploy/docker/api-service/init.sh /lowcoder/api-service/init.sh
RUN chmod +x /lowcoder/api-service/*.sh

##
## Intermediary Lowcoder api-service image
##
## To create a separate image out of it, build it with:
##   DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-api-service --target lowcoder-ce-api-service .
##
FROM eclipse-temurin:17-jammy as lowcoder-ce-api-service
LABEL maintainer="lowcoder"

RUN apt-get update && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/cache/apt/lists \
  && addgroup --system --gid 9001 lowcoder \
  && adduser --system --disabled-password --no-create-home --uid 9001 --gid 9001 lowcoder

# Copy lowcoder server configuration
COPY --chown=lowcoder:lowcoder --from=build-api-service /lowcoder/api-service /lowcoder/api-service

EXPOSE 8080
CMD [ "sh" , "/lowcoder/api-service/entrypoint.sh" ]

#############################################################################

##
## Build lowcoder node service
##
FROM ubuntu:jammy as build-node-service

RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates build-essential gnupg

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
FROM ubuntu:jammy as lowcoder-ce-node-service
LABEL maintainer="lowcoder"

RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates gnupg

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
FROM node:20.2-slim AS build-client
COPY ./client /lowcoder-client
WORKDIR /lowcoder-client
RUN yarn --immutable

# TODO: build lowcoder-comps

# curl is required for yarn build to succeed, because it calls it while building client
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

ARG REACT_APP_COMMIT_ID=test
ARG REACT_APP_ENV=production
ARG REACT_APP_EDITION=community
ARG REACT_APP_DISABLE_JS_SANDBOX=true
RUN yarn build


##
## Intermediary Lowcoder client image
##
## To create a separate image out of it, build it with:
##   DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-frontend --target lowcoder-ce-frontend .
##
FROM nginx:1.25.1 as lowcoder-ce-frontend
LABEL maintainer="lowcoder"

# Change default nginx user into lowcoder user and remove default nginx config
RUN usermod --login lowcoder --uid 9001 nginx \
  && groupmod --new-name lowcoder --gid 9001 nginx \
  && rm -f /etc/nginx/nginx.conf \
  && mkdir -p /lowcoder/assets

# Copy lowcoder client data
COPY --chown=lowcoder:lowcoder --from=build-client /lowcoder-client/packages/lowcoder/build/ /lowcoder/client

# Copy additional nginx init scripts
COPY deploy/docker/frontend/00-change-nginx-user.sh /docker-entrypoint.d/00-change-nginx-user.sh
COPY deploy/docker/frontend/01-update-nginx-conf.sh /docker-entrypoint.d/01-update-nginx-conf.sh

RUN chmod +x /docker-entrypoint.d/00-change-nginx-user.sh && \
    chmod +x /docker-entrypoint.d/01-update-nginx-conf.sh

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
FROM lowcoder-ce-frontend
LABEL maintainer="lowcoder"

RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates gnupg

# Add nodejs repo and keys
RUN mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list


# Install required packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y bash gnupg curl lsb-release \
  && curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb bullseye main" | tee /etc/apt/sources.list.d/redis.list \
  && curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg arch=amd64,arm64] http://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
  && if [ "$(dpkg --print-architecture)" = "amd64" ] || [ "$(dpkg --print-architecture)" = "i386" ]; then \
    curl -sL http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_$(dpkg --print-architecture).deb --output libssl1.1_1.1.1f-1ubuntu2_$(dpkg --print-architecture).deb; \
  else \
    curl -sL http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_$(dpkg --print-architecture).deb --output libssl1.1_1.1.1f-1ubuntu2_$(dpkg --print-architecture).deb; \
  fi \
  && dpkg -i libssl1.1_1.1.1f-1ubuntu2_$(dpkg --print-architecture).deb \
  && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install --no-install-recommends -y \
      mongodb-org \
      redis \
      supervisor \
      gosu \
      nodejs \
      openjdk-17-jdk-headless \
  && npm install -g yarn \
  && rm -rf /var/cache/apt/lists \
  && mkdir -p /lowcoder/assets

# Add lowcoder api-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-api-service /lowcoder/api-service /lowcoder/api-service

# Add lowcoder node-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-node-service /lowcoder/node-service /lowcoder/node-service

# Add services configuration
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/etc /lowcoder/etc

# Add startup script
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/entrypoint.sh /lowcoder/entrypoint.sh

EXPOSE 27017
EXPOSE 3000
EXPOSE 3443

ENTRYPOINT [ "/bin/sh" , "/lowcoder/entrypoint.sh" ]
CMD ["/usr/bin/supervisord", "-n" , "-c" , "/lowcoder/etc/supervisord.conf"]

