#!/bin/bash

set -e

export USER_ID=${LOWCODER_PUID:=9001}
export GROUP_ID=${LOWCODER_PGID:=9001}

# Set default variable values
echo "Overriding default environment variables:"
for line in `grep '^[ \t]*LOWCODER_.*$' /lowcoder/etc/default.env`; do
    VARNAME=`echo ${line} | sed -e 's/^\([A-Z0-9_]\+\)\([ \t]*=[ \t]*\)\(.*\)$/\1/'`
    if [ -z "$(eval echo \"\$$VARNAME\")" ]; then
        export $(eval echo "${line}")
    else
        echo "    ${line}"
    fi;
done;
echo "Done."

# Update ID of lowcoder user if required
if [ ! "$(id --user lowcoder)" -eq ${USER_ID} ]; then
    usermod --uid ${USER_ID} lowcoder
    echo "ID for lowcoder user changed to: ${USER_ID}"
fi;

# Update ID of lowcoder group if required
if [ ! "$(id --group lowcoder)" -eq ${GROUP_ID} ]; then
    groupmod --gid ${GROUP_ID} lowcoder
    echo "ID for lowcoder group changed to: ${GROUP_ID}"
fi;

# Update host on which mongo is supposed to listen
# If LOWCODER_MONGODB_EXPOSED is true, it will listen on all interfaces
if [ "${LOWCODER_MONGODB_EXPOSED}" = "true" ]; then
    export MONGO_LISTEN_HOST="0.0.0.0"
else
    export MONGO_LISTEN_HOST="127.0.0.1"
fi;

# Set the default mongodb connection string if not set explicitly
if [ -z "${LOWCODER_MONGODB_URL}" ]; then
    export LOWCODER_MONGODB_URL="mongodb://localhost:27017/lowcoder?authSource=admin"
fi;

LOGS="/lowcoder-stacks/logs"
DATA="/lowcoder-stacks/data"
CERT="/lowcoder-stacks/ssl"
# Create folder for holding application logs and data
mkdir -p ${LOGS}/redis \
  ${LOGS}/mongodb \
  ${LOGS}/api-service \
  ${LOGS}/node-service \
  ${LOGS}/frontend \
  ${DATA}/redis \
  ${DATA}/mongodb \
  ${CERT}

# Update owner of logs and data - do not try if not running as root (OpenShift)
if [ "$(id -u)" -eq 0 ]; then
  chown -R "${USER_ID}:${GROUP_ID}" /lowcoder-stacks/ /lowcoder/etc
fi

# Enable services
SUPERVISOR_AVAILABLE="/lowcoder/etc/supervisord/conf-available"
SUPERVISOR_ENABLED="/lowcoder/etc/supervisord/conf-enabled"

# Create folder for supervisor conf-enabled
mkdir -p ${SUPERVISOR_ENABLED}

# Recreate links to enabled services
rm -f ${SUPERVISOR_ENABLED}/*.conf

# Enable redis if configured to run
if [ "${LOWCODER_REDIS_ENABLED:=true}" = "true" ]; then
    ln ${SUPERVISOR_AVAILABLE}/01-redis.conf ${SUPERVISOR_ENABLED}/01-redis.conf
fi;

# Enable mongodb if configured to run
if [ "${LOWCODER_MONGODB_ENABLED:=true}" = "true" ]; then
    ln ${SUPERVISOR_AVAILABLE}/02-mongodb.conf ${SUPERVISOR_ENABLED}/02-mongodb.conf
fi;

# Enable api-service if configured to run
if [ "${LOWCODER_API_SERVICE_ENABLED:=true}" = "true" ]; then
    ln ${SUPERVISOR_AVAILABLE}/10-api-service.conf ${SUPERVISOR_ENABLED}/10-api-service.conf
fi;

# Enable node-service if configured to run
if [ "${LOWCODER_NODE_SERVICE_ENABLED:=true}" = "true" ]; then
    ln ${SUPERVISOR_AVAILABLE}/11-node-service.conf ${SUPERVISOR_ENABLED}/11-node-service.conf
fi;

# Enable frontend if configured to run
if [ "${LOWCODER_FRONTEND_ENABLED:=true}" = "true" ]; then
    ln ${SUPERVISOR_AVAILABLE}/20-frontend.conf ${SUPERVISOR_ENABLED}/20-frontend.conf
fi;

# disable user directive if image is running non-root (Openshift)
if [ "$(id -u)" -ne 0 ]; then
    for i in "${SUPERVISOR_ENABLED}"/*.conf; do
        sed -Ei 's/^\s*user=.*$//' "$i"
    done
fi

# Handle CMD command
"$@"
