#!/bin/bash

set -e

export USER_ID="${LOWCODER_PUID:=9001}"
export GROUP_ID="${LOWCODER_PGID:=9001}"

# Run init script
echo "Initializing api-service..."
/lowcoder/api-service/init.sh

if [ -z "$JAVA_HOME" ]; then
    JAVA_HOME=$(dirname "$(dirname "$(readlink -f "$(which javac)")")")
fi;
APP_JAR="${APP_JAR:=/lowcoder/api-service/lowcoder-api-service.jar}"
JAVA_OPTS="${JAVA_OPTS:=}"
CUSTOM_APP_PROPERTIES="${APP_PROPERTIES}"
CONTEXT_PATH=${CONTEXT_PATH:=/}

echo
echo "Running lowcoder api-server with:"
echo "  base path: ${CONTEXT_PATH}"

if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "    user id: ${USER_ID}"
  echo "   group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo
"${JAVA_HOME}/bin/java" -version
echo

cd /lowcoder/api-service
exec $GOSU "${JAVA_HOME}/bin/java" \
  -Djava.util.prefs.userRoot=/tmp \
  -Djava.security.egd=file:/dev/./urandom \
  -Dhttps.protocols=TLSv1.1,TLSv1.2 \
  -Dlog4j2.formatMsgNoLookups=true \
  -Dspring.config.location="file:///lowcoder/api-service/config/application.yaml" \
  --add-opens java.base/java.nio=ALL-UNNAMED \
  ${JAVA_OPTS} \
  -Dpf4j.pluginsDir=/lowcoder/api-service/plugins \
  -jar "${APP_JAR}" --spring.webflux.base-path="${CONTEXT_PATH}" ${CUSTOM_APP_PROPERTIES}

