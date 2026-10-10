#!/bin/bash

# Startup script of agora token service in the all-in-one image.
# The standalone image (Dockerfile next to this file) does not use it.

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}

# Fixed port - 8080 (the service default) is used by api-service in the all-in-one image
export SERVER_PORT=8081
export APP_ID="${LOWCODER_AGORA_APP_ID}"
export APP_CERTIFICATE="${LOWCODER_AGORA_APP_CERTIFICATE}"
export CORS_ALLOW_ORIGIN="${LOWCODER_AGORA_CORS_ALLOW_ORIGIN:=*}"

cd /lowcoder/agora-token-service/app

echo
echo "Running Lowcoder agora token service with:"
echo "              port: ${SERVER_PORT}"
echo "       CORS origin: ${CORS_ALLOW_ORIGIN}"
if [ -z "${APP_ID}" ] || [ -z "${APP_CERTIFICATE}" ]; then
  echo "  WARNING: LOWCODER_AGORA_APP_ID or LOWCODER_AGORA_APP_CERTIFICATE is not set, token requests will fail"
fi
if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "           user id: ${USER_ID}"
  echo "          group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo

exec $GOSU node server.js
