#!/bin/bash

# Startup script of hocuspocus server in the all-in-one image.
# The standalone image (Dockerfile next to this file) does not use it.

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}

# Fixed port, matches the default websocket URL baked into the client (ws://localhost:3006)
export PORT=3006
export HOST=0.0.0.0
# Must match REACT_APP_HOCUSPOCUS_SECRET the client was built with (empty by default)
export HOCUSPOCUS_SECRET="${LOWCODER_HOCUSPOCUS_SECRET}"

cd /lowcoder/hocuspocus/app

echo
echo "Running Lowcoder hocuspocus server with:"
echo "              port: ${PORT}"
if [ -n "${HOCUSPOCUS_SECRET}" ]; then
  echo "    authentication: enabled"
else
  echo "    authentication: disabled"
fi
if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "           user id: ${USER_ID}"
  echo "          group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo

exec $GOSU node hocuspocus-server.js
