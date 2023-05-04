#!/bin/bash

set -e 

NODE_SERVICE_ROOT=/lowcoder/node-service

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

# Update node-server installation owner
if [ "${DO_CHOWN}" = "true" ]; then
    echo "Changing node-service owner to ${USER_ID}:${GROUP_ID}"
    chown -R ${USER_ID}:${GROUP_ID} ${NODE_SERVICE_ROOT}
fi;

echo "Lowcoder node-service setup finished."
