#!/bin/bash

set -e

API_SERVICE_ROOT=/lowcoder/api-service

# Update ID of lowcoder user if required
if [ ! `id --user lowcoder` -eq ${USER_ID} ]; then
    usermod --uid ${USER_ID} lowcoder
    echo "ID for lowcoder user changed to: ${USER_ID}"
    DO_CHOWN="true"
fi;

# Update ID of lowcoder group if required
if [ ! `id --group lowcoder` -eq ${GROUP_ID} ]; then
    groupmod --gid ${GROUP_ID} lowcoder
    echo "ID for lowcoder group changed to: ${GROUP_ID}"
    DO_CHOWN="true"
fi;

# Update api-server installation owner
if [ "${DO_CHOWN}" = "true" ]; then
    chown -R ${USER_ID}:${GROUP_ID} ${API_SERVICE_ROOT}
fi;

# Link log files to /dev/null
#   - we don't need log files, because all logs are also printed to console
if [ ! -e ${API_SERVICE_ROOT}/logs/main.log ]; then
    ln -s /dev/null ${API_SERVICE_ROOT}/logs/main.log
    chmod 777 ${API_SERVICE_ROOT}/logs/main.log
fi;

if [ ! -e ${API_SERVICE_ROOT}/logs/query-error.log ]; then
    ln -s /dev/null ${API_SERVICE_ROOT}/logs/query-error.log
    chmod 777 ${API_SERVICE_ROOT}/logs/query-error.log
fi;

echo "Lowcoder api-service setup finished."
