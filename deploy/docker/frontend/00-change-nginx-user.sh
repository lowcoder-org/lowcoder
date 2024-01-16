#!/bin/sh

set -e

USER_ID=${LOWCODER_PUID:=9001}
GROUP_ID=${LOWCODER_PGID:=9001}
CLIENT_ROOT=/lowcoder/client

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
    chown -R ${USER_ID}:${GROUP_ID} ${CLIENT_ROOT}
    echo "Lowcoder client files owner modified."
fi;

