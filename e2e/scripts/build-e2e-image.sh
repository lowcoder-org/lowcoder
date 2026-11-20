#!/bin/bash

##
## Builds the image the end-to-end tests run against: the published 3.0.0 all-in-one image with its web client
## replaced by the client of the 3.0.0 release plus the testability hooks in e2e/client-hooks.patch. The tests need
## those hooks (the editor-ready attribute, the test ids of the insert panel, the tab roles, the component name on
## canvas items), which the released client does not have. Nothing else of the client differs from 3.0.0, so defects
## found with this image are those of 3.0.0.
##
## Usage (from any directory):
##   e2e/scripts/build-e2e-image.sh
##
## Environment:
##   BASE_IMAGE   image to start from (default lowcoderorg/lowcoder-ce:3.0.0)
##   TARGET_IMAGE image to create (default lowcoderorg/lowcoder-ce:3.0.0-e2e, the default of run-in-docker.sh)
##   CLIENT_REF   git ref whose client/ is built (default 3.0.0, the release tag; it must exist locally)
##
## Steps: export client/ of CLIENT_REF with `git archive` to a temporary directory, apply e2e/client-hooks.patch, run
## `yarn --immutable && yarn build` there in a node container (the Dockerfile's client build stage, same node image
## and build arguments), then `docker build` a layer that replaces /lowcoder/client of the base image with the built
## client. Takes several minutes.
##
## Not covered: the server (api-service, node-service) stays the one of the base image, and so do the components
## (client-comps), the SDK and the embed bundle; only the main client (packages/lowcoder) is replaced. The patch has
## to apply to CLIENT_REF; for another ref it may need regenerating.
##

set -euo pipefail

readonly DEFAULT_BASE_IMAGE="lowcoderorg/lowcoder-ce:3.0.0"
readonly DEFAULT_TARGET_IMAGE="lowcoderorg/lowcoder-ce:3.0.0-e2e"
readonly BASE_IMAGE="${BASE_IMAGE:-$DEFAULT_BASE_IMAGE}"
readonly TARGET_IMAGE="${TARGET_IMAGE:-$DEFAULT_TARGET_IMAGE}"
# Same as the build-client stage of deploy/docker/Dockerfile
readonly CLIENT_REF="${CLIENT_REF:-3.0.0}"
readonly NODE_IMAGE="node:22.23-slim"
readonly NODE_MAX_OLD_SPACE_MB=12288
# Owner of /lowcoder/client in the image (user lowcoder, group lowcoder)
readonly CLIENT_OWNER="9001:9001"
readonly CLIENT_BUILD_SUBDIR="packages/lowcoder/build"

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
readonly HOOKS_PATCH="$SCRIPT_DIR/../client-hooks.patch"
readonly WORK_DIR="$(mktemp -d)"
readonly BUILD_CONTAINER="lowcoder-e2e-image-$$"

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

cleanup() {
    docker rm -f "$BUILD_CONTAINER" > /dev/null 2>&1 || true
    # The build container runs as root; hand the files back so they can be removed
    docker run --rm -v "$WORK_DIR":/work "$NODE_IMAGE" chown -R "$(id -u):$(id -g)" /work > /dev/null 2>&1 || true
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

log "Exporting client/ of $CLIENT_REF and applying $HOOKS_PATCH"
git -C "$REPO_DIR" archive "$CLIENT_REF" client | tar -C "$WORK_DIR" -xf -
patch -p1 -d "$WORK_DIR" < "$HOOKS_PATCH"

log "Building the client with $NODE_IMAGE (several minutes)"
docker run --rm --name "$BUILD_CONTAINER" -v "$WORK_DIR/client":/lowcoder-client -w /lowcoder-client \
    -e REACT_APP_COMMIT_ID=test -e REACT_APP_ENV=production -e REACT_APP_EDITION=community \
    -e HOST_OWNER="$(id -u):$(id -g)" -e REACT_APP_DISABLE_JS_SANDBOX=true -e NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_MB}" \
    "$NODE_IMAGE" sh -c 'apt-get update > /dev/null && apt-get install -y --no-install-recommends curl ca-certificates > /dev/null && yarn --immutable && yarn build; status=$?; chown -R "$HOST_OWNER" /lowcoder-client; exit $status'

[ -f "$WORK_DIR/client/$CLIENT_BUILD_SUBDIR/index.html" ] || { echo "ERROR: the build produced no index.html" >&2; exit 1; }

log "Building $TARGET_IMAGE from $BASE_IMAGE"
mkdir -p "$WORK_DIR/context"
mv "$WORK_DIR/client/$CLIENT_BUILD_SUBDIR" "$WORK_DIR/context/client"
docker build -t "$TARGET_IMAGE" -f - "$WORK_DIR/context" <<DOCKERFILE
FROM $BASE_IMAGE
RUN rm -rf /lowcoder/client && mkdir /lowcoder/client
COPY --chown=$CLIENT_OWNER client/ /lowcoder/client/
DOCKERFILE
log "Built $TARGET_IMAGE"
