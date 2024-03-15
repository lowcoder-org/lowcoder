#!/bin/bash

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}
export API_HOST="${LOWCODER_API_SERVICE_URL:=http://localhost:8080}"

# Run init script
echo "Initializing node-service..."
/lowcoder/node-service/init.sh

cd /lowcoder/node-service/app

echo
echo "Running Lowcoder node-service with:"
echo "  API service host: ${API_HOST}"
if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "           user id: ${USER_ID}"
  echo "          group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo

exec $GOSU yarn start
