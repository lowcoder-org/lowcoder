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
##                       independent of the other flags). Run: E2E_INCLUDE_SUPERADMIN=1 $0 --grep @superadmin
##   E2E_INCLUDE_NODE_SERVICE_SIDECARS  set to 1 to also start the sidecars of the node-service data sources: real servers a plugin can be pointed at, for plugins
##                       whose protocol the echo cannot serve (Firebird: a wire protocol) or whose real behaviour the echo's canned answers say nothing about (libSQL, CouchDB, DynamoDB Local)
##                       (today a Firebird server, FIREBIRD_IMAGE below, a libSQL server, LIBSQL_IMAGE below, a CouchDB server, COUCHDB_IMAGE below, and a DynamoDB Local server, DYNAMODB_IMAGE below) and run their @node-service-sidecar tests; independent of the
##                       other flags, default stack only (any other profile is an error). Without it the run starts none of them,
##                       neither lists nor runs those tests, and pulls no extra image.
##                       Run only these: E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 $0 --grep @node-service-sidecar
##   E2E_STACK_PROFILE   which stack to start: `default` (the all-in-one image in its SAAS workspace mode; the default) or
##                       `enterprise` (the same image with LOWCODER_WORKSPACE_MODE=ENTERPRISE: one workspace shared by every
##                       user; it runs only the @enterprise tests, SEC-E01 to SEC-E04, E06a, E06b) or `signup-disabled` (the same
##                       image with LOWCODER_EMAIL_SIGNUP_ENABLED=false: nobody may sign up with e-mail; it runs only the
##                       @signup-disabled tests, LC-AU20 to AU24, because every fixture that makes a user signs up). Any other value
##                       is an error.
##                       A --grep of the command line narrows the profile's own selection further (measured, Playwright 1.64:
##                       it does not replace it). Gate: E2E_STACK_PROFILE=enterprise $0 --repeat-each=10 --workers=4 tests/security/enterprise.spec.ts
##   E2E_INCLUDE_ENTERPRISE_TAKEOVER  set to 1, with E2E_STACK_PROFILE=enterprise (any other profile is an error), to run SEC-E05
##                       ALONE (no other test of the run): it resets the super admin's password, so it needs a stack of its own.
##                       It is quarantined, so it needs E2E_INCLUDE_QUARANTINE=1 as well:
##                       E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise $0
##   POSTGRES_IMAGE      PostgreSQL sidecar for the data source tests (pinned by digest)
##   FIREBIRD_IMAGE      Firebird sidecar of the @node-service-sidecar tests (pinned by tag and digest); used only with E2E_INCLUDE_NODE_SERVICE_SIDECARS
##   LIBSQL_IMAGE        libSQL server (sqld) sidecar of the @node-service-sidecar tests (pinned by tag and digest); used only with E2E_INCLUDE_NODE_SERVICE_SIDECARS
##   COUCHDB_IMAGE       CouchDB sidecar of the @node-service-sidecar tests (pinned by tag and digest); used only with E2E_INCLUDE_NODE_SERVICE_SIDECARS
##   DYNAMODB_IMAGE      DynamoDB Local sidecar of the @node-service-sidecar tests (pinned by tag and digest); used only with E2E_INCLUDE_NODE_SERVICE_SIDECARS
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
## address as E2E_ECHO_URL and its IP address on the run network as E2E_ECHO_IP (for the few tests that must not derive a host
## name, e.g. an S3 virtual-host address `<bucket>.<host>`). Nothing is sent to the internet by it. The app and runner containers resolve the alias through
## `--add-host e2e-echo:<sidecar IP on the run network>`, not through DNS: should the sidecar die, the name still points at that
## private address and the request fails locally (refused or unreachable) instead of the name resolving on an external resolver.
##
## Only with E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 it also starts a Firebird sidecar (FIREBIRD_IMAGE, data of fixtures/firebird/init.sql) under the
## alias e2e-firebird, port 3050: the target of the Firebird data source of node-service (the plugin speaks the Firebird wire protocol over TCP,
## which the echo cannot stand in for). It starts after the echo, so the app can resolve the alias through `--add-host e2e-firebird:<IP>` like
## the echo (the same reason), and the runner gets the alias as E2E_FIREBIRD_HOST. The script waits until a SELECT of the seeded table through
## the image's own isql answers over TCP, and `cleanup` removes the container however the run ends. Its credentials are throw-away constants
## that must equal FIREBIRD in e2e/src/constants.ts. Without the flag nothing of this runs: no container, no image pull, no variable for the runner.
##
## Only with E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 it also starts a libSQL server sidecar (LIBSQL_IMAGE) under the alias e2e-libsql, port 8080: the target of
## the Turso data source of node-service (a real Hrana-over-HTTP server in place of the echo's canned answers). It starts after the Firebird sidecar and
## is reached exactly like it: `--add-host e2e-libsql:<IP>` for the app container and the runner, and the alias as E2E_LIBSQL_HOST for the runner.
## sqld accepts only a JWT signed by a throw-away key: the script gives it the public half (LIBSQL_JWT_PUBLIC_KEY) and uses the read-write token
## (LIBSQL_TOKEN) for its readiness call, one real `select 1` pipeline posted to the sidecar from the echo container over the run network. Both
## must equal LIBSQL in e2e/src/constants.ts. The database lives in a tmpfs (the image declares /var/lib/sqld a volume, which `docker rm -f` would
## leave behind), and `cleanup` removes the container however the run ends. Without the flag nothing of this runs.
##
## Only with E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 it also starts a CouchDB sidecar (COUCHDB_IMAGE) under the alias e2e-couchdb, port 5984: the target of the CouchDB data
## source of node-service (a real Apache CouchDB server in place of the echo's canned answers). It starts after the libSQL sidecar and is reached exactly like it:
## `--add-host e2e-couchdb:<IP>` for the app container and the runner, and the alias as E2E_COUCHDB_HOST for the runner. The image makes one server admin from
## COUCHDB_USER and COUCHDB_PASSWORD (throw-away constants that must equal COUCHDB in e2e/src/constants.ts). A fresh single node has none of the system databases
## (`_all_dbs` answers an empty list), so the readiness step creates `_users`, `_replicator` and `_global_changes` through the real HTTP API (PUT answers 201, or
## 412 when it exists already) and is ready when `_all_dbs` lists all three; it runs inside the sidecar container (the image has curl) against 127.0.0.1, and is repeated
## until it succeeds or STARTUP_TIMEOUT passes. The data lives in a tmpfs (the image declares /opt/couchdb/data a volume, which `docker rm -f` would leave behind),
## and `cleanup` removes the container however the run ends. Without the flag nothing of this runs.
##
## Only with E2E_INCLUDE_NODE_SERVICE_SIDECARS=1 it also starts a DynamoDB Local sidecar (DYNAMODB_IMAGE) under the alias e2e-dynamodb, port 8000: the target of the DynamoDB data
## source of node-service (a real server that implements the DynamoDB wire API in place of the echo's canned answers). It starts after the CouchDB sidecar and is reached exactly
## like it: `--add-host e2e-dynamodb:<IP>` for the app container and the runner, and the alias as E2E_DYNAMODB_HOST for the runner. It runs in memory with one database shared by
## every access key (`-inMemory -sharedDb`), checks no credential, and the image declares no volume, so `cleanup` removes everything however the run ends. The script waits until
## one real ListTables call, posted from the echo container over the run network, answers 200 with a `TableNames` member. Without the flag nothing of this runs.
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
# The image's data directory (it declares it a volume), mounted as a tmpfs so that no anonymous volume outlives the run
readonly POSTGRES_DATA_DIR="/var/lib/postgresql/data"
# Firebird sidecar of the @node-service-sidecar tests, started only with E2E_INCLUDE_NODE_SERVICE_SIDECARS. Tag and digest of the image:
# 3.0.12 with Legacy_Auth first (below): node-firebird 1.1.9 attached 100 of 100 times; with the image's default Srp, 12 of 100 attaches failed
# with "Your user name and password are not defined" (README, "Firebird sidecar"). The values below must equal FIREBIRD in e2e/src/constants.ts;
# they are throw-away, the container dies with the run.
readonly DEFAULT_FIREBIRD_IMAGE="firebirdsql/firebird:3.0.12@sha256:e45c9bc4fdacaaddc1980a05b7bb8b297f09fe019eadefb059006efe4dafe875"
readonly FIREBIRD_IMAGE="${FIREBIRD_IMAGE:-$DEFAULT_FIREBIRD_IMAGE}"
readonly FIREBIRD_DATABASE_FILE="e2e.fdb"
# The image's data directory (it declares it a volume), mounted as a tmpfs so that no anonymous volume outlives the run
readonly FIREBIRD_DATA_DIR="/var/lib/firebird/data"
readonly FIREBIRD_DATABASE_PATH="$FIREBIRD_DATA_DIR/$FIREBIRD_DATABASE_FILE"
readonly FIREBIRD_USER="e2euser"
readonly FIREBIRD_PASSWORD="e2e-firebird-password"
readonly FIREBIRD_ROOT_PASSWORD="e2e-firebird-root-password"
# The image's switch for Legacy_Auth before Srp and WireCrypt `Enabled` instead of `Required` (node-firebird 1.1.9 has no wire encryption)
readonly FIREBIRD_USE_LEGACY_AUTH="true"
readonly FIREBIRD_ALIAS="e2e-firebird"
readonly FIREBIRD_PORT=3050
# libSQL server (sqld) sidecar of the @node-service-sidecar tests, started only with E2E_INCLUDE_NODE_SERVICE_SIDECARS. The image is sqld 0.24.33 by tag and
# digest. It is told to accept only a JWT (SQLD_AUTH_JWT_KEY: the URL-safe base64 of a PUBLIC Ed25519 key); the matching private key was thrown away after
# signing the tokens of LIBSQL in e2e/src/constants.ts, so the values below are throw-away, the container dies with the run. LIBSQL_PORT is the image's
# own HTTP port. The values below must equal LIBSQL in e2e/src/constants.ts (the foundation tests check it, and that the token verifies under the key).
readonly DEFAULT_LIBSQL_IMAGE="ghcr.io/tursodatabase/libsql-server:v0.24.33@sha256:f8ca0134cdded747793888e48591aece07647d9d598d3ac229aabfa93159ca88"
readonly LIBSQL_IMAGE="${LIBSQL_IMAGE:-$DEFAULT_LIBSQL_IMAGE}"
readonly LIBSQL_ALIAS="e2e-libsql"
readonly LIBSQL_PORT=8080
readonly LIBSQL_JWT_PUBLIC_KEY="GC25tiEOubxlGdpbkc60UOXqUQeepEUWZmAbEKjt1rQ"
readonly LIBSQL_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicncifQ.tlvnzqEfO2pnCYHReSfLIQ3dHk393fsOH5hLtLo4ZkJWJV6b9q9Zf56QbS5spbT2G9XuzYQaVsZqO4jUVSsPAw"
# The image's data directory, mounted as a tmpfs so that no anonymous volume outlives the run
readonly LIBSQL_DATA_DIR="/var/lib/sqld"
# CouchDB sidecar of the @node-service-sidecar tests, started only with E2E_INCLUDE_NODE_SERVICE_SIDECARS. The image is Apache CouchDB 3.5.1 by tag and digest. It makes
# one server admin from COUCHDB_USER and COUCHDB_PASSWORD, throw-away values that must equal COUCHDB in e2e/src/constants.ts (the foundation tests check it); the
# container dies with the run. COUCHDB_PORT is the image's own HTTP port.
readonly DEFAULT_COUCHDB_IMAGE="couchdb:3.5.1@sha256:ccea1e8035bf7afd68336e24056a1ca9c1c46d7abe42da686322c0ac7218e5c2"
readonly COUCHDB_IMAGE="${COUCHDB_IMAGE:-$DEFAULT_COUCHDB_IMAGE}"
readonly COUCHDB_ALIAS="e2e-couchdb"
readonly COUCHDB_PORT=5984
readonly COUCHDB_USER="e2eadmin"
readonly COUCHDB_PASSWORD="e2e-couchdb-password"
# The system databases a fresh single node lacks; the readiness step creates them (names equal COUCHDB.SYSTEM_DATABASES in e2e/src/constants.ts)
readonly COUCHDB_SYSTEM_DATABASES=("_users" "_replicator" "_global_changes")
# The statuses of a PUT of a database that count as "there": 201 created, 412 already exists
readonly COUCHDB_HTTP_CREATED="201"
readonly COUCHDB_HTTP_EXISTS="412"
# Seconds a single readiness request may take to connect and in total (a local server answers in milliseconds); small against POLL_INTERVAL and STARTUP_TIMEOUT
# so that a stalled request ends the attempt and the wait loop checks its deadline again
# The wait loops of the four sidecars (Firebird, libSQL, CouchDB, DynamoDB Local) measure real elapsed time with the shell's SECONDS and compare it with STARTUP_TIMEOUT after every
# failed probe, so the time a probe takes counts. The check comes before the sleep and the next probe, hence the worst case is STARTUP_TIMEOUT + POLL_INTERVAL + PROBE_REQUEST_TIMEOUT
# (plus the overhead of the docker calls and up to one second of clock granularity, SECONDS counts whole seconds), not an unbounded multiple. This holds for each of the four because
# one probe is bounded as a whole: the Firebird probe is one isql under `timeout -s KILL`, the libSQL and DynamoDB probes are one fetch with an abort signal, and the CouchDB
# probe (five requests) shares one PROBE_REQUEST_TIMEOUT budget (couchdb_curl). The PostgreSQL, echo and app waits still count sleeps only (their probes have no time limit).
readonly PROBE_CONNECT_TIMEOUT=2
readonly PROBE_REQUEST_TIMEOUT=5
# The image's data directory, mounted as a tmpfs so that no anonymous volume outlives the run
readonly COUCHDB_DATA_DIR="/opt/couchdb/data"
# DynamoDB Local sidecar of the @node-service-sidecar tests, started only with E2E_INCLUDE_NODE_SERVICE_SIDECARS. The image is amazon/dynamodb-local 3.3.2 by tag and
# digest. It runs in memory (`-inMemory`) with one database for every access key (`-sharedDb`); it checks no credential, and the image declares no volume, so nothing
# outlives the container. DYNAMODB_PORT is the image's own HTTP port.
readonly DEFAULT_DYNAMODB_IMAGE="amazon/dynamodb-local:3.3.2@sha256:6ada631ec7aa5fc83446855eb17233e3dad184fec47477e8140c6c569cfe0c86"
readonly DYNAMODB_IMAGE="${DYNAMODB_IMAGE:-$DEFAULT_DYNAMODB_IMAGE}"
readonly DYNAMODB_ALIAS="e2e-dynamodb"
readonly DYNAMODB_PORT=8000
# The one status the readiness ListTables call counts as "there"
readonly DYNAMODB_HTTP_OK=200
# The instance super admin of the throw-away stack; the domain equals TEST_EMAIL_DOMAIN in e2e/src/constants.ts; the suite
# reads the name from E2E_SUPERUSER_USERNAME (SUPER_ADMIN_ENV). The password is generated per run (generate_superuser_password).
readonly SUPERUSER_USERNAME="e2e-superadmin@example.test"
readonly SUPERUSER_PASSWORD_BYTES=18

# Stack profiles (the values equal STACK_PROFILES in e2e/src/constants.ts). There is no compose file: the profile is this
# variable, and the enterprise one only adds the workspace mode to the app container.
readonly DEFAULT_PROFILE="default"
readonly ENTERPRISE_PROFILE="enterprise"
readonly ENTERPRISE_WORKSPACE_MODE="ENTERPRISE"
readonly SIGNUP_DISABLED_PROFILE="signup-disabled"
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
readonly FIREBIRD_CONTAINER="${NAME_PREFIX}-fb"
readonly LIBSQL_CONTAINER="${NAME_PREFIX}-libsql"
readonly COUCHDB_CONTAINER="${NAME_PREFIX}-couchdb"
readonly DYNAMODB_CONTAINER="${NAME_PREFIX}-dynamodb"
# The alias and port the app container and the runner use; E2E_ECHO_URL below is built from them (the suite reads it by ECHO_ENV in e2e/src/constants.ts)
readonly ECHO_ALIAS="e2e-echo"
readonly ECHO_PORT=8080
# The echo sidecar is also the mail sink: the app sends its mails (password reset, invitation) to ECHO_ALIAS:MAIL_PORT, no TLS, no login
readonly MAIL_PORT=2525
readonly ECHO_HEALTH_PATH="/__e2e/health"
readonly ECHO_SCRIPT="$SCRIPT_DIR/echo-server.js"
# Set by start_echo: the sidecar's IP on the run network (used for --add-host of the app and the runner)
ECHO_IP=""
# Set by start_firebird, start_libsql, start_couchdb and start_dynamodb (only with E2E_INCLUDE_NODE_SERVICE_SIDECARS): the extra `--add-host` and `-e` arguments of the app and the runner. Empty otherwise.
SIDECAR_ADD_HOST=()
SIDECAR_RUNNER_ENV=()

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

cleanup() {
    docker rm -f "$RUNNER_CONTAINER" "$APP_CONTAINER" "$POSTGRES_CONTAINER" "$ECHO_CONTAINER" "$FIREBIRD_CONTAINER" "$LIBSQL_CONTAINER" "$COUCHDB_CONTAINER" "$DYNAMODB_CONTAINER" > /dev/null 2>&1 || true
    docker network rm "$NETWORK" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# True when the run was asked for the node-service sidecars (the variable is set and not empty).
node_service_sidecars_enabled() {
    [ -n "${E2E_INCLUDE_NODE_SERVICE_SIDECARS:-}" ]
}

check_stack_profile() {
    case "$STACK_PROFILE" in
        "$DEFAULT_PROFILE" | "$ENTERPRISE_PROFILE" | "$SIGNUP_DISABLED_PROFILE") ;;
        *) fail "E2E_STACK_PROFILE=\"$STACK_PROFILE\" names no stack; use $DEFAULT_PROFILE, $ENTERPRISE_PROFILE or $SIGNUP_DISABLED_PROFILE" ;;
    esac
    if [ -n "${E2E_INCLUDE_ENTERPRISE_TAKEOVER:-}" ] && [ "$STACK_PROFILE" != "$ENTERPRISE_PROFILE" ]; then
        fail "E2E_INCLUDE_ENTERPRISE_TAKEOVER needs E2E_STACK_PROFILE=$ENTERPRISE_PROFILE"
    fi
    if node_service_sidecars_enabled && [ "$STACK_PROFILE" != "$DEFAULT_PROFILE" ]; then
        fail "E2E_INCLUDE_NODE_SERVICE_SIDECARS needs E2E_STACK_PROFILE=$DEFAULT_PROFILE (the other stacks run no @node-service-sidecar test)"
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
    elif [ "$STACK_PROFILE" = "$SIGNUP_DISABLED_PROFILE" ]; then
        profile_env=(-e "LOWCODER_EMAIL_SIGNUP_ENABLED=false")
    fi
    log "Starting $APP_IMAGE as $APP_CONTAINER (stack profile $STACK_PROFILE)"
    docker run -d --name "$APP_CONTAINER" --network "$NETWORK" --network-alias "$E2E_APP_HOST" --add-host "${ECHO_ALIAS}:${ECHO_IP}" "${SIDECAR_ADD_HOST[@]}" "${publish[@]}" "${profile_env[@]}" \
        -e LOWCODER_PUBLIC_URL="http://${E2E_APP_HOST}:${APP_PORT}/" \
        -e LOWCODER_SUPERUSER_USERNAME -e LOWCODER_SUPERUSER_PASSWORD \
        -e LOWCODER_ADMIN_SMTP_HOST="$ECHO_ALIAS" -e LOWCODER_ADMIN_SMTP_PORT="$MAIL_PORT" \
        -e LOWCODER_ADMIN_SMTP_AUTH=false -e LOWCODER_ADMIN_SMTP_STARTTLS_ENABLED=false -e LOWCODER_ADMIN_SMTP_STARTTLS_REQUIRED=false \
        "$APP_IMAGE" > /dev/null
}

start_postgres() {
    log "Starting $POSTGRES_IMAGE as $POSTGRES_CONTAINER"
    docker run -d --name "$POSTGRES_CONTAINER" --network "$NETWORK" \
        -e POSTGRES_DB="$POSTGRES_DATABASE" -e POSTGRES_USER="$POSTGRES_USER" -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        --tmpfs "$POSTGRES_DATA_DIR" -v "$E2E_DIR/fixtures/sql":/docker-entrypoint-initdb.d:ro \
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
        -v "$ECHO_SCRIPT":/echo/echo-server.js:ro -e ECHO_PORT="$ECHO_PORT" -e MAIL_PORT="$MAIL_PORT" \
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

# The init script runs once, with isql, when the image creates the database; the server starts after it, so a SELECT of the seeded table over
# TCP (127.0.0.1 inside the container: not the embedded engine) means the data is there and the server answers. The image's own isql, so no
# client is needed here.
start_firebird() {
    log "Starting $FIREBIRD_IMAGE as $FIREBIRD_CONTAINER (alias $FIREBIRD_ALIAS, port $FIREBIRD_PORT)"
    docker run -d --name "$FIREBIRD_CONTAINER" --network "$NETWORK" --network-alias "$FIREBIRD_ALIAS" \
        -e FIREBIRD_ROOT_PASSWORD="$FIREBIRD_ROOT_PASSWORD" -e FIREBIRD_USER="$FIREBIRD_USER" -e FIREBIRD_PASSWORD="$FIREBIRD_PASSWORD" \
        -e FIREBIRD_DATABASE="$FIREBIRD_DATABASE_FILE" -e FIREBIRD_USE_LEGACY_AUTH="$FIREBIRD_USE_LEGACY_AUTH" \
        --tmpfs "$FIREBIRD_DATA_DIR" -v "$E2E_DIR/fixtures/firebird":/docker-entrypoint-initdb.d:ro \
        "$FIREBIRD_IMAGE" > /dev/null
    local firebird_ip
    firebird_ip="$(docker inspect -f "{{(index .NetworkSettings.Networks \"$NETWORK\").IPAddress}}" "$FIREBIRD_CONTAINER")"
    [ -n "$firebird_ip" ] || fail "no IP address for $FIREBIRD_CONTAINER on $NETWORK"
    SIDECAR_ADD_HOST=(--add-host "${FIREBIRD_ALIAS}:${firebird_ip}")
    SIDECAR_RUNNER_ENV=(-e "E2E_FIREBIRD_HOST=${FIREBIRD_ALIAS}")
    log "Firebird sidecar is $FIREBIRD_ALIAS = $firebird_ip"
}

wait_for_firebird() {
    local waited=0 started=$SECONDS
    until echo "SELECT COUNT(*) FROM FB_ITEMS;" | docker exec -i "$FIREBIRD_CONTAINER" timeout -s KILL "$PROBE_REQUEST_TIMEOUT" /opt/firebird/bin/isql -b -user "$FIREBIRD_USER" -password "$FIREBIRD_PASSWORD" "127.0.0.1:${FIREBIRD_DATABASE_PATH}" > /dev/null 2>&1; do
        waited=$((SECONDS - started))
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$FIREBIRD_CONTAINER" >&2 || true
            fail "the Firebird sidecar did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
    done
    waited=$((SECONDS - started))
    log "Firebird sidecar ready after ${waited}s"
}

# sqld needs no init script: the tests make their own tables. The sidecar is started after the echo (its container is the one that probes it).
start_libsql() {
    log "Starting $LIBSQL_IMAGE as $LIBSQL_CONTAINER (alias $LIBSQL_ALIAS, port $LIBSQL_PORT)"
    docker run -d --name "$LIBSQL_CONTAINER" --network "$NETWORK" --network-alias "$LIBSQL_ALIAS" \
        --tmpfs "$LIBSQL_DATA_DIR" -e SQLD_AUTH_JWT_KEY="$LIBSQL_JWT_PUBLIC_KEY" \
        "$LIBSQL_IMAGE" > /dev/null
    local libsql_ip
    libsql_ip="$(docker inspect -f "{{(index .NetworkSettings.Networks \"$NETWORK\").IPAddress}}" "$LIBSQL_CONTAINER")"
    [ -n "$libsql_ip" ] || fail "no IP address for $LIBSQL_CONTAINER on $NETWORK"
    SIDECAR_ADD_HOST+=(--add-host "${LIBSQL_ALIAS}:${libsql_ip}")
    SIDECAR_RUNNER_ENV+=(-e "E2E_LIBSQL_HOST=${LIBSQL_ALIAS}")
    log "libSQL sidecar is $LIBSQL_ALIAS = $libsql_ip"
}

# A real Hrana pipeline with the read-write token, posted to the sidecar's alias over the run network from the echo container (the image has no
# curl and no shell tools of use): ready when it answers 200 with the integer 1 for `select 1`.
wait_for_libsql() {
    local waited=0 started=$SECONDS
    local probe="fetch(process.env.LIBSQL_PROBE_URL + '/v2/pipeline', { signal: AbortSignal.timeout($((PROBE_REQUEST_TIMEOUT * 1000))), method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.LIBSQL_PROBE_TOKEN }, body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'select 1' } }, { type: 'close' }] }) }).then((r) => r.text().then((t) => process.exit(r.ok && t.includes('\"value\":\"1\"') ? 0 : 1)), () => process.exit(1))"
    until docker exec -e LIBSQL_PROBE_URL="http://${LIBSQL_ALIAS}:${LIBSQL_PORT}" -e LIBSQL_PROBE_TOKEN="$LIBSQL_TOKEN" "$ECHO_CONTAINER" node -e "$probe" > /dev/null 2>&1; do
        waited=$((SECONDS - started))
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$LIBSQL_CONTAINER" >&2 || true
            fail "the libSQL sidecar did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
    done
    waited=$((SECONDS - started))
    log "libSQL sidecar ready after ${waited}s"
}

# A fresh single-node CouchDB has an admin and no system databases. This probe is idempotent and runs inside the sidecar over 127.0.0.1 (the image has curl):
# the server must answer `_up`, each system database is created through the real API (it counts only when the server answers 201 created or 412 already
# exists; any other answer, or none, is "not ready yet"), and `_all_dbs` must list all of them. A stalled request ends the probe and the loop of wait_for_couchdb
# re-checks its deadline instead of blocking past STARTUP_TIMEOUT.
# The probe makes five requests, so the limit is on the WHOLE probe, not on each request: COUCHDB_PROBE_DEADLINE is the second (of the shell's SECONDS) at which the probe
# must be over, set by couchdb_probe; every request gets the time that is left of it as its total limit (and at most PROBE_CONNECT_TIMEOUT to connect), and a request that
# finds nothing left is not made and fails the probe.
COUCHDB_PROBE_DEADLINE=0
couchdb_curl() {
    local remaining=$((COUCHDB_PROBE_DEADLINE - SECONDS)) connect_limit="$PROBE_CONNECT_TIMEOUT"
    [ "$remaining" -gt 0 ] || return 1
    [ "$remaining" -ge "$connect_limit" ] || connect_limit="$remaining"
    docker exec "$COUCHDB_CONTAINER" curl --connect-timeout "$connect_limit" --max-time "$remaining" -u "${COUCHDB_USER}:${COUCHDB_PASSWORD}" "$@"
}

couchdb_probe() {
    local base="http://127.0.0.1:${COUCHDB_PORT}" database status listed
    COUCHDB_PROBE_DEADLINE=$((SECONDS + PROBE_REQUEST_TIMEOUT))
    couchdb_curl -sf "${base}/_up" > /dev/null || return 1
    for database in "${COUCHDB_SYSTEM_DATABASES[@]}"; do
        status="$(couchdb_curl -s -o /dev/null -w '%{http_code}' -X PUT "${base}/${database}")" || return 1
        case "$status" in
            "$COUCHDB_HTTP_CREATED" | "$COUCHDB_HTTP_EXISTS") ;;
            *) return 1 ;;
        esac
    done
    listed="$(couchdb_curl -sf "${base}/_all_dbs")" || return 1
    for database in "${COUCHDB_SYSTEM_DATABASES[@]}"; do
        case "$listed" in
            *"\"${database}\""*) ;;
            *) return 1 ;;
        esac
    done
}

# The sidecar is started after the libSQL one. The tests make their own databases.
start_couchdb() {
    log "Starting $COUCHDB_IMAGE as $COUCHDB_CONTAINER (alias $COUCHDB_ALIAS, port $COUCHDB_PORT)"
    docker run -d --name "$COUCHDB_CONTAINER" --network "$NETWORK" --network-alias "$COUCHDB_ALIAS" \
        --tmpfs "$COUCHDB_DATA_DIR" -e COUCHDB_USER="$COUCHDB_USER" -e COUCHDB_PASSWORD="$COUCHDB_PASSWORD" \
        "$COUCHDB_IMAGE" > /dev/null
    local couchdb_ip
    couchdb_ip="$(docker inspect -f "{{(index .NetworkSettings.Networks \"$NETWORK\").IPAddress}}" "$COUCHDB_CONTAINER")"
    [ -n "$couchdb_ip" ] || fail "no IP address for $COUCHDB_CONTAINER on $NETWORK"
    SIDECAR_ADD_HOST+=(--add-host "${COUCHDB_ALIAS}:${couchdb_ip}")
    SIDECAR_RUNNER_ENV+=(-e "E2E_COUCHDB_HOST=${COUCHDB_ALIAS}")
    log "CouchDB sidecar is $COUCHDB_ALIAS = $couchdb_ip"
}

wait_for_couchdb() {
    local waited=0 started=$SECONDS
    until couchdb_probe > /dev/null 2>&1; do
        waited=$((SECONDS - started))
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$COUCHDB_CONTAINER" >&2 || true
            fail "the CouchDB sidecar did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
    done
    waited=$((SECONDS - started))
    log "CouchDB sidecar ready after ${waited}s"
}

# The image runs the JVM server as its entrypoint (`java -jar DynamoDBLocal.jar`); the flags are the image's own command line plus `-sharedDb`.
start_dynamodb() {
    log "Starting $DYNAMODB_IMAGE as $DYNAMODB_CONTAINER (alias $DYNAMODB_ALIAS, port $DYNAMODB_PORT)"
    docker run -d --name "$DYNAMODB_CONTAINER" --network "$NETWORK" --network-alias "$DYNAMODB_ALIAS" \
        "$DYNAMODB_IMAGE" -jar DynamoDBLocal.jar -inMemory -sharedDb -port "$DYNAMODB_PORT" > /dev/null
    local dynamodb_ip
    dynamodb_ip="$(docker inspect -f "{{(index .NetworkSettings.Networks \"$NETWORK\").IPAddress}}" "$DYNAMODB_CONTAINER")"
    [ -n "$dynamodb_ip" ] || fail "no IP address for $DYNAMODB_CONTAINER on $NETWORK"
    SIDECAR_ADD_HOST+=(--add-host "${DYNAMODB_ALIAS}:${dynamodb_ip}")
    SIDECAR_RUNNER_ENV+=(-e "E2E_DYNAMODB_HOST=${DYNAMODB_ALIAS}")
    log "DynamoDB Local sidecar is $DYNAMODB_ALIAS = $dynamodb_ip"
}

# A real ListTables call posted to the sidecar's alias over the run network from the echo container (the image has no curl and no shell tools of use). The server wants an
# Authorization header with a `Credential=` scope and does not verify the signature. Ready when it answers exactly DYNAMODB_HTTP_OK with a JSON body whose `TableNames` member is an array (a body that is not JSON, or any error, exits non-zero); the fetch aborts
# after the request limit, so a stalled request ends the attempt and the wait loop checks its deadline again.
wait_for_dynamodb() {
    local waited=0 started=$SECONDS
    local probe="fetch(process.env.DYNAMODB_PROBE_URL, { signal: AbortSignal.timeout($((PROBE_REQUEST_TIMEOUT * 1000))), method: 'POST', headers: { 'Content-Type': 'application/x-amz-json-1.0', 'X-Amz-Target': 'DynamoDB_20120810.ListTables', Authorization: 'AWS4-HMAC-SHA256 Credential=e2e/20260101/us-west-1/dynamodb/aws4_request, SignedHeaders=host, Signature=00' }, body: '{}' }).then((r) => r.text().then((t) => process.exit(r.status === $DYNAMODB_HTTP_OK && Array.isArray(JSON.parse(t).TableNames) ? 0 : 1))).catch(() => process.exit(1))"
    until docker exec -e DYNAMODB_PROBE_URL="http://${DYNAMODB_ALIAS}:${DYNAMODB_PORT}/" "$ECHO_CONTAINER" node -e "$probe" > /dev/null 2>&1; do
        waited=$((SECONDS - started))
        if [ "$waited" -ge "$STARTUP_TIMEOUT" ]; then
            docker logs --tail "$LOG_TAIL_LINES" "$DYNAMODB_CONTAINER" >&2 || true
            fail "the DynamoDB Local sidecar did not become ready within ${STARTUP_TIMEOUT}s"
        fi
        sleep "$POLL_INTERVAL"
    done
    waited=$((SECONDS - started))
    log "DynamoDB Local sidecar ready after ${waited}s"
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
    docker run --rm --name "$RUNNER_CONTAINER" --network "$NETWORK" --add-host "${ECHO_ALIAS}:${ECHO_IP}" "${SIDECAR_ADD_HOST[@]}" --init --ipc=host \
        --user "$(id -u):$(id -g)" -e HOME=/tmp \
        -e CI="${CI:-}" \
        -e LOWCODER_BASE_URL="http://${E2E_APP_HOST}:${APP_PORT}" \
        -e E2E_POSTGRES_HOST="$POSTGRES_CONTAINER" \
        -e E2E_ECHO_URL="http://${ECHO_ALIAS}:${ECHO_PORT}" \
        -e E2E_ECHO_IP="$ECHO_IP" \
        -e E2E_INCLUDE_QUARANTINE="${E2E_INCLUDE_QUARANTINE:-}" \
        -e E2E_INCLUDE_INSERT_ALL="${E2E_INCLUDE_INSERT_ALL:-}" \
        -e E2E_INCLUDE_SUPERADMIN="${E2E_INCLUDE_SUPERADMIN:-}" \
        -e E2E_INCLUDE_ENTERPRISE_TAKEOVER="${E2E_INCLUDE_ENTERPRISE_TAKEOVER:-}" \
        -e E2E_INCLUDE_NODE_SERVICE_SIDECARS="${E2E_INCLUDE_NODE_SERVICE_SIDECARS:-}" \
        "${SIDECAR_RUNNER_ENV[@]}" \
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
if node_service_sidecars_enabled; then
    start_firebird
fi
if node_service_sidecars_enabled; then
    start_libsql
fi
if node_service_sidecars_enabled; then
    start_couchdb
fi
if node_service_sidecars_enabled; then
    start_dynamodb
fi
start_app
wait_for_postgres
wait_for_echo
if node_service_sidecars_enabled; then
    wait_for_firebird
fi
if node_service_sidecars_enabled; then
    wait_for_libsql
fi
if node_service_sidecars_enabled; then
    wait_for_couchdb
fi
if node_service_sidecars_enabled; then
    wait_for_dynamodb
fi
wait_for_app
run_tests "$@"
