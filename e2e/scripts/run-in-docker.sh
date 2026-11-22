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
##   E2E_INCLUDE_INSERT_ALL  set to 1 to also run the @insert-all tests (S1, the insert-every-component smoke test, 112
##                       tests); independent of E2E_INCLUDE_QUARANTINE. Nightly: E2E_INCLUDE_INSERT_ALL=1 $0 --grep @insert-all
##   E2E_INCLUDE_SUPERADMIN  set to 1 to also run the @superadmin tests (SEC-R16a to SEC-R16d, the instance super admin;
##                       independent of the other flags; SEC-R16c and SEC-R16d also carry @quarantine and then need
##                       E2E_INCLUDE_QUARANTINE=1 too). Run: E2E_INCLUDE_SUPERADMIN=1 $0 --grep @superadmin
##   E2E_STACK_PROFILE   which stack to start: `default` (the all-in-one image in its SAAS workspace mode; the default) or
##                       `enterprise` (the same image with LOWCODER_WORKSPACE_MODE=ENTERPRISE: one workspace shared by every
##                       user; it runs only the @enterprise tests, SEC-E01 to SEC-E04, E06a, E06b). Any other value is an error.
##                       A --grep of the command line narrows the profile's own selection further (measured, Playwright 1.64:
##                       it does not replace it). Gate: E2E_STACK_PROFILE=enterprise $0 --repeat-each=10 --workers=4 tests/security/enterprise.spec.ts
##   E2E_INCLUDE_ENTERPRISE_TAKEOVER  set to 1, with E2E_STACK_PROFILE=enterprise (any other profile is an error), to run SEC-E05
##                       ALONE (no other test of the run): it resets the super admin's password, so it needs a stack of its own.
##                       It is quarantined, so it needs E2E_INCLUDE_QUARANTINE=1 as well:
##                       E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise $0
##   POSTGRES_IMAGE      PostgreSQL sidecar for the data source tests (pinned by digest)
##   E2E_HOST_PORT       also publish the app on 127.0.0.1:<port> to look at it in a browser while the run lasts
##
## Set by the script for each run (a value of the caller is overwritten; the password is new every run, never printed,
## never on a command line: both containers get it through Docker's name-only `-e NAME` form):
##   E2E_SUPERUSER_USERNAME, E2E_SUPERUSER_PASSWORD   the instance super admin of the stack (the app gets them as
##                       LOWCODER_SUPERUSER_USERNAME / LOWCODER_SUPERUSER_PASSWORD); read by the `superAdmin` fixture
##                       of e2e/src/fixtures.ts. Keep `set -x` off in this script.
##
## One run per checkout at a time (a lock on e2e/.run.lock; needs flock, on macOS `brew install flock`).
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
## Also starts an HTTP echo sidecar (scripts/echo-server.js, on the already pinned runner image, no extra download) under the
## alias e2e-echo: the target of the requests the SERVER makes inside the app container (npm registry proxy, n8n plugin).
## It records every request in memory and serves them back per path prefix; it dies with the run. The runner gets its
## address as E2E_ECHO_URL. Nothing is sent to the internet by it. The app and runner containers resolve the alias through
## `--add-host e2e-echo:<sidecar IP on the run network>`, not through DNS: should the sidecar die, the name still points at that
## private address and the request fails locally (refused or unreachable) instead of the name resolving on an external resolver.
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
# The instance super admin of the throw-away stack; the domain equals TEST_EMAIL_DOMAIN in e2e/src/constants.ts; the suite
# reads the name from E2E_SUPERUSER_USERNAME (SUPER_ADMIN_ENV). The password is generated per run (generate_superuser_password).
readonly SUPERUSER_USERNAME="e2e-superadmin@example.test"
readonly SUPERUSER_PASSWORD_BYTES=18

# Stack profiles (the values equal STACK_PROFILES in e2e/src/constants.ts). There is no compose file: the profile is this
# variable, and the enterprise one only adds the workspace mode to the app container.
readonly DEFAULT_PROFILE="default"
readonly ENTERPRISE_PROFILE="enterprise"
readonly ENTERPRISE_WORKSPACE_MODE="ENTERPRISE"
readonly STACK_PROFILE="${E2E_STACK_PROFILE:-$DEFAULT_PROFILE}"

# shellcheck source=app-host.sh
source "$(dirname "${BASH_SOURCE[0]}")/app-host.sh"
readonly APP_PORT="$E2E_APP_PORT"
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
readonly ECHO_CONTAINER="${NAME_PREFIX}-echo"
# The alias and port the app container and the runner use; E2E_ECHO_URL below is built from them (the suite reads it by ECHO_ENV in e2e/src/constants.ts)
readonly ECHO_ALIAS="e2e-echo"
readonly ECHO_PORT=8080
readonly ECHO_HEALTH_PATH="/__e2e/health"
readonly ECHO_SCRIPT="$SCRIPT_DIR/echo-server.js"
# Set by start_echo: the sidecar's IP on the run network (used for --add-host of the app and the runner)
ECHO_IP=""

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

cleanup() {
    docker rm -f "$RUNNER_CONTAINER" "$APP_CONTAINER" "$POSTGRES_CONTAINER" "$ECHO_CONTAINER" > /dev/null 2>&1 || true
    docker network rm "$NETWORK" > /dev/null 2>&1 || true
}
trap cleanup EXIT

check_stack_profile() {
    case "$STACK_PROFILE" in
        "$DEFAULT_PROFILE" | "$ENTERPRISE_PROFILE") ;;
        *) fail "E2E_STACK_PROFILE=\"$STACK_PROFILE\" names no stack; use $DEFAULT_PROFILE or $ENTERPRISE_PROFILE" ;;
    esac
    if [ -n "${E2E_INCLUDE_ENTERPRISE_TAKEOVER:-}" ] && [ "$STACK_PROFILE" != "$ENTERPRISE_PROFILE" ]; then
        fail "E2E_INCLUDE_ENTERPRISE_TAKEOVER needs E2E_STACK_PROFILE=$ENTERPRISE_PROFILE"
    fi
}

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

# One random password per run. It is exported, never echoed and never an argument of a command: `docker run -e NAME`
# (name only) takes the value from this script's environment.
generate_superuser_password() {
    local password
    password="$(head -c "$SUPERUSER_PASSWORD_BYTES" /dev/urandom | od -An -tx1 | tr -d ' \n')"
    export E2E_SUPERUSER_USERNAME="$SUPERUSER_USERNAME" E2E_SUPERUSER_PASSWORD="$password"
    export LOWCODER_SUPERUSER_USERNAME="$SUPERUSER_USERNAME" LOWCODER_SUPERUSER_PASSWORD="$password"
}

start_app() {
    local publish=() profile_env=()
    if [ -n "${E2E_HOST_PORT:-}" ]; then
        publish=(-p "127.0.0.1:${E2E_HOST_PORT}:${APP_PORT}")
    fi
    if [ "$STACK_PROFILE" = "$ENTERPRISE_PROFILE" ]; then
        profile_env=(-e "LOWCODER_WORKSPACE_MODE=$ENTERPRISE_WORKSPACE_MODE")
    fi
    log "Starting $APP_IMAGE as $APP_CONTAINER (stack profile $STACK_PROFILE)"
    docker run -d --name "$APP_CONTAINER" --network "$NETWORK" --network-alias "$E2E_APP_HOST" --add-host "${ECHO_ALIAS}:${ECHO_IP}" "${publish[@]}" "${profile_env[@]}" \
        -e LOWCODER_PUBLIC_URL="http://${E2E_APP_HOST}:${APP_PORT}/" \
        -e LOWCODER_SUPERUSER_USERNAME -e LOWCODER_SUPERUSER_PASSWORD \
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

# The runner image already holds Node, so the echo server needs no image of its own.
start_echo() {
    log "Starting the echo sidecar as $ECHO_CONTAINER (alias $ECHO_ALIAS, port $ECHO_PORT)"
    docker run -d --name "$ECHO_CONTAINER" --network "$NETWORK" --network-alias "$ECHO_ALIAS" --init \
        --user "$(id -u):$(id -g)" \
        -v "$ECHO_SCRIPT":/echo/echo-server.js:ro -e ECHO_PORT="$ECHO_PORT" \
        "$PLAYWRIGHT_IMAGE" node /echo/echo-server.js > /dev/null
    ECHO_IP="$(docker inspect -f "{{(index .NetworkSettings.Networks \"$NETWORK\").IPAddress}}" "$ECHO_CONTAINER")"
    [ -n "$ECHO_IP" ] || fail "no IP address for $ECHO_CONTAINER on $NETWORK"
    log "Echo sidecar is $ECHO_ALIAS = $ECHO_IP"
}

wait_for_echo() {
    local waited=0
    until docker exec "$ECHO_CONTAINER" node -e "fetch('http://localhost:${ECHO_PORT}${ECHO_HEALTH_PATH}').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))" > /dev/null 2>&1; do
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$ECHO_CONTAINER" >&2 || true
            fail "the echo sidecar did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
        waited=$((waited + POLL_INTERVAL))
    done
    log "Echo sidecar ready after ${waited}s"
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
    docker run --rm --name "$RUNNER_CONTAINER" --network "$NETWORK" --add-host "${ECHO_ALIAS}:${ECHO_IP}" --init --ipc=host \
        --user "$(id -u):$(id -g)" -e HOME=/tmp \
        -e CI="${CI:-}" \
        -e LOWCODER_BASE_URL="http://${E2E_APP_HOST}:${APP_PORT}" \
        -e E2E_POSTGRES_HOST="$POSTGRES_CONTAINER" \
        -e E2E_ECHO_URL="http://${ECHO_ALIAS}:${ECHO_PORT}" \
        -e E2E_INCLUDE_QUARANTINE="${E2E_INCLUDE_QUARANTINE:-}" \
        -e E2E_INCLUDE_INSERT_ALL="${E2E_INCLUDE_INSERT_ALL:-}" \
        -e E2E_INCLUDE_SUPERADMIN="${E2E_INCLUDE_SUPERADMIN:-}" \
        -e E2E_INCLUDE_ENTERPRISE_TAKEOVER="${E2E_INCLUDE_ENTERPRISE_TAKEOVER:-}" \
        -e E2E_STACK_PROFILE="$STACK_PROFILE" \
        -e E2E_SUPERUSER_USERNAME -e E2E_SUPERUSER_PASSWORD \
        -v "$E2E_DIR":/work -w /work \
        "$PLAYWRIGHT_IMAGE" \
        sh -c 'npm ci --no-audit --no-fund && npx playwright test "$@"' sh "$@" || status=$?
    return "$status"
}

# Two runs on one checkout would share node_modules, test-results and playwright-report in e2e/: refuse the second.
acquire_run_lock() {
    exec 9> "$E2E_DIR/.run.lock"
    flock -n 9 || fail "another run uses $E2E_DIR (lock $E2E_DIR/.run.lock); wait for it or use another checkout"
}

check_stack_profile
acquire_run_lock
check_playwright_versions
check_app_image
generate_superuser_password
docker network create "$NETWORK" > /dev/null
start_postgres
start_echo
start_app
wait_for_postgres
wait_for_echo
wait_for_app
run_tests "$@"
