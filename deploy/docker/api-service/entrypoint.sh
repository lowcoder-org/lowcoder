#!/bin/bash

set -e

export USER_ID="${LOWCODER_PUID:=9001}"
export GROUP_ID="${LOWCODER_PGID:=9001}"

# Run init script
echo "Initializing api-service..."
/lowcoder/api-service/init.sh

if [ -z $JAVA_HOME ]; then
    JAVA_HOME=`dirname $(dirname $(readlink -f $(which javac)))`
fi;
APP_JAR="${APP_JAR:=/lowcoder/api-service/server.jar}"
JAVA_OPTS="${JAVA_OPTS:=}"
CUSTOM_APP_PROPERTIES="${APP_PROPERTIES}"
CONTEXT_PATH=${CONTEXT_PATH:=/}

echo
echo "Running lowcoder api-server with:"
echo "    user id: ${USER_ID}"
echo "   group id: ${GROUP_ID}"
echo "  base path: ${CONTEXT_PATH}"
echo
${JAVA_HOME}/bin/java -version
echo

cd /lowcoder/api-service
source set-classpath.sh

exec gosu ${USER_ID}:${GROUP_ID} ${JAVA_HOME}/bin/java \
  -Djava.util.prefs.userRoot=/tmp \
  -Djava.security.egd=file:/dev/./urandom \
  -Dhttps.protocols=TLSv1.1,TLSv1.2 \
  -Dlog4j2.formatMsgNoLookups=true \
  -Dspring.config.location="file:///lowcoder/api-service/config/application.yml,file:///lowcoder/api-service/config/application-selfhost.yml" \
  --add-opens java.base/java.nio=ALL-UNNAMED \
  -cp "${LOWCODER_CLASSPATH:=.}" \
  ${JAVA_OPTS} \
  org.lowcoder.api.ServerApplication --spring.webflux.base-path=${CONTEXT_PATH} ${CUSTOM_APP_PROPERTIES}

