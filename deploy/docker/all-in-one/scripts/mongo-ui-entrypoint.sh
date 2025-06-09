#!/bin/bash

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}

# Mongo express configuration
export ME_CONFIG_MONGODB_URL="${LOWCODER_MONGODB_URL:=mongodb://localhost:27017/lowcoder?authSource=admin}"
export ME_CONFIG_MONGODB_ENABLE_ADMIN=true
export ME_CONFIG_SITE_BASEURL="/mongo-ui"
export ME_CONFIG_REQUEST_SIZE=200mb
export ME_CONFIG_OPTIONS_NO_DELETE=true
export ME_CONFIG_OPTIONS_EDITORTHEME=rubyblue
export ME_CONFIG_SITE_GRIDFS_ENABLED=true
export ME_CONFIG_OPTIONS_FULLWIDTH_LAYOUT=false
export ME_CONFIG_BASICAUTH=${LOWCODER_MONGODB_EXPOSED:false}
export ME_CONFIG_BASICAUTH_USERNAME="${LOWCODER_MONGOUI_USERNAME}"
export ME_CONFIG_BASICAUTH_PASSWORD="${LOWCODER_MONGOUI_PASSWORD}"
export VCAP_APP_HOST="127.0.0.1"
export PORT="9999"

export ME_CONFIG_SITE_COOKIESECRET=`cat /proc/sys/kernel/random/uuid | sed 's/[-]//g' | head -c 30`
export ME_CONFIG_SITE_SESSIONSECRET=`cat /proc/sys/kernel/random/uuid | sed 's/[-]//g' | head -c 30`

cd /lowcoder/mongo-express/app

echo
echo "Running Mongodb UI with:"
if [ "$(id -u)" -eq 0 ]; then
  # only use su if its possible, suppress for containers running non-root
  echo "           user id: ${USER_ID}"
  echo "          group id: ${GROUP_ID}"
  GOSU="gosu ${USER_ID}:${GROUP_ID}"
fi
echo

exec $GOSU node app

