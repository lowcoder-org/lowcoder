#!/bin/bash

# Startup script of proxy-service in the all-in-one image.
# The standalone image (server/proxy-service/Dockerfile) does not use it.

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}

# Fixed port, must match the port in LOWCODER_PROXY_SERVICE_URL used by nginx
export PROXY_SERVICE_PORT=6070

cd /lowcoder/proxy-service/app

echo
echo "Running Lowcoder proxy-service with:"
echo "              port: ${PROXY_SERVICE_PORT}"
echo "  API service host: ${LOWCODER_API_SERVICE_URL:=http://localhost:8080}"
echo "    hocuspocus URL: ${LOWCODER_HOCUSPOCUS_URL:=ws://localhost:3006}"
if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "           user id: ${USER_ID}"
  echo "          group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo

exec $GOSU node build/server.js
