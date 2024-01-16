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
echo "           user id: ${USER_ID}"
echo "          group id: ${GROUP_ID}"
echo

exec gosu ${USER_ID}:${GROUP_ID}  yarn start

