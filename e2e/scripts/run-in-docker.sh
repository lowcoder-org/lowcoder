#!/bin/bash

##
## Runs the Lowcoder end-to-end tests (Playwright) against a fresh all-in-one container.
##
## Starts the all-in-one image on its own Docker network, waits until the API answers, runs the tests from the
## official Playwright image on the same network (the app is reachable by its container name), and removes
## the container and the network when it ends, however it ends.
##
## Usage (from any directory):
##   e2e/scripts/run-in-docker.sh [playwright test arguments]
##   e2e/scripts/run-in-docker.sh --grep @smoke
##   e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4
##
## Environment:
##   LOWCODER_E2E_IMAGE  image under test (default lowcoderorg/lowcoder-ce:3.0.0-e2e, made by
##                       e2e/scripts/build-e2e-image.sh: the 3.0.0 image with the client of this checkout; the
##                       tests need the hooks of that client, so a release image without them fails)
##   PLAYWRIGHT_IMAGE    runner image; its version must equal @playwright/test in e2e/package-lock.json
##                       (default mcr.microsoft.com/playwright:v1.64.0-noble)
##   E2E_INCLUDE_QUARANTINE  set to 1 to also run the @quarantine tests (they expose known defects)
##   POSTGRES_IMAGE      PostgreSQL sidecar for the data source tests (pinned by digest)
##   E2E_HOST_PORT       also publish the app on 127.0.0.1:<port> to look at it in a browser while the run lasts
##
## Results: e2e/playwright-report (HTML), e2e/test-results (JUnit, traces, videos, screenshots of failures).
## Exit code: the one of `playwright test`; non-zero when the app does not start or the versions differ.
##
## One-off, after changing e2e/package.json: regenerate the lockfile inside the runner image
##   docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/e2e":/work -w /work \
##     mcr.microsoft.com/playwright:v1.64.0-noble npm install --no-audit --no-fund
##
## Also starts a PostgreSQL sidecar with the data of fixtures/sql/init.sql; the tests reach it by container name
## (the name is passed as E2E_POSTGRES_HOST).
##
## Not covered: Firefox and WebKit (only Chromium runs), the multi-container compose setup, databases other than
## PostgreSQL.
##

set -euo pipefail

readonly DEFAULT_APP_IMAGE="lowcoderorg/lowcoder-ce:3.0.0-e2e"
readonly DEFAULT_PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v1.64.0-noble"
readonly APP_IMAGE="${LOWCODER_E2E_IMAGE:-$DEFAULT_APP_IMAGE}"
readonly PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-$DEFAULT_PLAYWRIGHT_IMAGE}"

readonly DEFAULT_POSTGRES_IMAGE="postgres:17-alpine@sha256:778d0b486d6daa02b77434d0358ec57a1b21fd8b6d22ac2eef56a33e816928f6"
readonly POSTGRES_IMAGE="${POSTGRES_IMAGE:-$DEFAULT_POSTGRES_IMAGE}"
# Must equal POSTGRES in e2e/src/constants.ts
readonly POSTGRES_DATABASE="shop"
readonly POSTGRES_USER="postgres"
readonly POSTGRES_PASSWORD="e2e-postgres-password"

readonly APP_PORT=3000
readonly READY_PATH="/api/configs"
# Seconds to wait for the app to answer, and between two checks
readonly STARTUP_TIMEOUT=300
readonly POLL_INTERVAL=2
readonly LOG_TAIL_LINES=60

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly E2E_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly LOCKFILE="$E2E_DIR/package-lock.json"

readonly NAME_PREFIX="lowcoder-e2e-$$"
readonly NETWORK="${NAME_PREFIX}-net"
readonly APP_CONTAINER="${NAME_PREFIX}-app"
readonly POSTGRES_CONTAINER="${NAME_PREFIX}-pg"
readonly RUNNER_CONTAINER="${NAME_PREFIX}-runner"

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

cleanup() {
    docker rm -f "$RUNNER_CONTAINER" "$APP_CONTAINER" "$POSTGRES_CONTAINER" > /dev/null 2>&1 || true
    docker network rm "$NETWORK" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# Version of @playwright/test locked in package-lock.json
locked_playwright_version() {
    awk '/"node_modules\/@playwright\/test"/ { found = 1 }
         found && /"version"/ { gsub(/[",]/, "", $2); print $2; exit }' "$LOCKFILE"
}

# Version in the tag of the runner image, v1.64.0-noble -> 1.64.0
image_playwright_version() {
    local tag="${PLAYWRIGHT_IMAGE##*:}"
    tag="${tag#v}"
    echo "${tag%%-*}"
}

check_playwright_versions() {
    [ -f "$LOCKFILE" ] || fail "$LOCKFILE is missing; see the usage comment of this script to generate it"
    local locked image
    locked="$(locked_playwright_version)"
    image="$(image_playwright_version)"
    [ -n "$locked" ] || fail "no @playwright/test version found in $LOCKFILE"
    if [ "$locked" != "$image" ]; then
        fail "@playwright/test $locked (package-lock.json) does not match the runner image $PLAYWRIGHT_IMAGE ($image)"
    fi
}

check_app_image() {
    if ! docker image inspect "$APP_IMAGE" > /dev/null 2>&1 && [ "$APP_IMAGE" = "$DEFAULT_APP_IMAGE" ]; then
        fail "image $APP_IMAGE does not exist; build it with e2e/scripts/build-e2e-image.sh"
    fi
}

start_app() {
    local publish=()
    if [ -n "${E2E_HOST_PORT:-}" ]; then
        publish=(-p "127.0.0.1:${E2E_HOST_PORT}:${APP_PORT}")
    fi
    log "Starting $APP_IMAGE as $APP_CONTAINER"
    docker run -d --name "$APP_CONTAINER" --network "$NETWORK" "${publish[@]}" \
        -e LOWCODER_PUBLIC_URL="http://${APP_CONTAINER}:${APP_PORT}/" \
        -e LOWCODER_SUPERUSER_PASSWORD="$(head -c 18 /dev/urandom | od -An -tx1 | tr -d ' \n')" \
        "$APP_IMAGE" > /dev/null
}

start_postgres() {
    log "Starting $POSTGRES_IMAGE as $POSTGRES_CONTAINER"
    docker run -d --name "$POSTGRES_CONTAINER" --network "$NETWORK" \
        -e POSTGRES_DB="$POSTGRES_DATABASE" -e POSTGRES_USER="$POSTGRES_USER" -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -v "$E2E_DIR/fixtures/sql":/docker-entrypoint-initdb.d:ro \
        "$POSTGRES_IMAGE" > /dev/null
}

# The image starts a temporary server for the init scripts, so "accepting connections" alone is too early:
# wait until the seeded table can be read.
wait_for_postgres() {
    local waited=0
    until docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -tAc "SELECT count(*) FROM items" > /dev/null 2>&1; do
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$POSTGRES_CONTAINER" >&2 || true
            fail "PostgreSQL did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
        waited=$((waited + POLL_INTERVAL))
    done
    log "PostgreSQL ready after ${waited}s"
}

wait_for_app() {
    local waited=0
    log "Waiting for $READY_PATH (at most ${STARTUP_TIMEOUT}s)"
    until docker exec "$APP_CONTAINER" curl -sf "http://localhost:${APP_PORT}${READY_PATH}" > /dev/null 2>&1; do
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$APP_CONTAINER" >&2 || true
            fail "the application did not answer on $READY_PATH within ${STARTUP_TIMEOUT}s"
        fi
        if [ "$(docker inspect -f '{{.State.Running}}' "$APP_CONTAINER" 2>/dev/null)" != "true" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$APP_CONTAINER" >&2 || true
            fail "the application container stopped"
        fi
        sleep "$POLL_INTERVAL"
        waited=$((waited + POLL_INTERVAL))
    done
    log "Application ready after ${waited}s"
}

run_tests() {
    log "Running Playwright from $PLAYWRIGHT_IMAGE"
    local status=0
    # --init and --ipc=host: recommended by Playwright for Chromium in Docker (https://playwright.dev/docs/docker)
    docker run --rm --name "$RUNNER_CONTAINER" --network "$NETWORK" --init --ipc=host \
        --user "$(id -u):$(id -g)" -e HOME=/tmp \
        -e CI="${CI:-}" \
        -e LOWCODER_BASE_URL="http://${APP_CONTAINER}:${APP_PORT}" \
        -e E2E_POSTGRES_HOST="$POSTGRES_CONTAINER" \
        -e E2E_INCLUDE_QUARANTINE="${E2E_INCLUDE_QUARANTINE:-}" \
        -v "$E2E_DIR":/work -w /work \
        "$PLAYWRIGHT_IMAGE" \
        sh -c 'npm ci --no-audit --no-fund && npx playwright test "$@"' sh "$@" || status=$?
    return "$status"
}

check_playwright_versions
check_app_image
docker network create "$NETWORK" > /dev/null
start_postgres
start_app
wait_for_postgres
wait_for_app
run_tests "$@"
