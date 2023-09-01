##
## Create custom JRE for running Lowcoder server application
##
FROM eclipse-temurin:17-jdk-jammy AS jre-build
RUN jlink --add-modules java.base,java.compiler,java.datatransfer,java.desktop,java.instrument,java.logging,java.management,java.management.rmi,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.se,java.security.jgss,java.security.sasl,java.smartcardio,java.sql,java.sql.rowset,java.transaction.xa,java.xml,java.xml.crypto,jdk.accessibility,jdk.charsets,jdk.crypto.cryptoki,jdk.crypto.ec,jdk.dynalink,jdk.httpserver,jdk.incubator.foreign,jdk.incubator.vector,jdk.internal.vm.ci,jdk.jdwp.agent,jdk.jfr,jdk.jsobject,jdk.localedata,jdk.management,jdk.management.agent,jdk.management.jfr,jdk.naming.dns,jdk.naming.rmi,jdk.net,jdk.nio.mapmode,jdk.sctp,jdk.security.auth,jdk.security.jgss,jdk.unsupported,jdk.xml.dom,jdk.zipfs,jdk.attach \
          --output /build/jre \
          --no-man-pages \
          --no-header-files \
          --compress=2

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

# Copy Java runtime for running server
COPY --from=jre-build /build/jre /lowcoder/api-service/jre

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
FROM ubuntu:jammy as lowcoder-ce-api-service
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

RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates build-essential

# Download nodejs and install yarn
RUN curl -sL https://deb.nodesource.com/setup_19.x | bash - \
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

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y curl ca-certificates \
  && curl -sL https://deb.nodesource.com/setup_19.x | bash - \
  && apt-get install --no-install-recommends -y nodejs gosu \
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
FROM nginx:1.25.2 as lowcoder-ce-frontend
LABEL maintainer="lowcoder"

# Change default nginx user into lowcoder user and remove default nginx config
RUN usermod --login lowcoder --uid 9001 nginx \
  && groupmod --new-name lowcoder --gid 9001 nginx \
  && rm -f /etc/nginx/nginx.conf

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

# Install required packages
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y bash gnupg curl lsb-release \
  && curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb bullseye main" | tee /etc/apt/sources.list.d/redis.list \
  && curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg arch=amd64,arm64] http://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
  && curl -sL https://deb.nodesource.com/setup_19.x | bash - \
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
  && npm install -g yarn \
  && rm -rf /var/cache/apt/lists

# Add lowcoder api-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-api-service /lowcoder/api-service /lowcoder/api-service

# Add lowcoder node-service
COPY --chown=lowcoder:lowcoder --from=lowcoder-ce-node-service /lowcoder/node-service /lowcoder/node-service

# Add services configuration
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/etc /lowcoder/etc

# Add startup script
COPY --chown=lowcoder:lowcoder deploy/docker/all-in-one/entrypoint.sh /lowcoder/entrypoint.sh

EXPOSE 3000
EXPOSE 3443

ENTRYPOINT [ "/bin/sh" , "/lowcoder/entrypoint.sh" ]
CMD ["/usr/bin/supervisord", "-n" , "-c" , "/lowcoder/etc/supervisord.conf"]

