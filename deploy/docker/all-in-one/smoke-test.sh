#!/bin/bash

##
## Smoke test of the Lowcoder all-in-one image.
##
## Starts the image several times and checks that every bundled service runs,
## is reachable on its port, receives its LOWCODER_* configuration, and that
## the LOWCODER_*_ENABLED switches remove services.
##
## Usage (from project root, after building the image):
##   deploy/docker/all-in-one/smoke-test.sh [image]
##
## Not covered: HTTPS frontend setup, external mongodb/redis, real Agora
## credentials (dummy ones only prove that the env mapping reaches the service).
##

set -uo pipefail

readonly IMAGE="${1:-lowcoderorg/lowcoder-ce:latest}"
readonly CONTAINER_PREFIX="lowcoder-smoke-$$"

readonly STATUS_PASS="PASS"
readonly STATUS_FAIL="FAIL"

# Seconds to wait for services to become ready
readonly STARTUP_TIMEOUT=300
readonly DISABLED_STARTUP_WAIT=20
readonly POLL_INTERVAL=3

readonly REQUIRED_NODE_MAJOR="v22"

readonly PROGRAMS_DEFAULT="redis mongodb hocuspocus agora-token-service api-service node-service proxy-service frontend"
readonly PROGRAMS_NEW="hocuspocus agora-token-service proxy-service"

readonly URL_API_SERVICE="http://localhost:8080"
readonly URL_NODE_SERVICE="http://localhost:6060"
readonly URL_PROXY_SERVICE="http://localhost:6070"
readonly URL_HOCUSPOCUS="http://localhost:3006"
readonly URL_AGORA="http://localhost:8081"
readonly URL_FRONTEND="http://localhost:3000"

readonly MSG_API_UP="Lowcoder API is up and runnig"
readonly MSG_NODE_UP="Lowcoder Node Service is up and running"
readonly MSG_PROXY_UP="Lowcoder Proxy Service is up and running"

# 32 hex characters, the format of Agora App ID / App Certificate
readonly DUMMY_AGORA_APP_ID="0123456789abcdef0123456789abcdef"
readonly DUMMY_AGORA_APP_CERTIFICATE="fedcba9876543210fedcba9876543210"

# Arbitrary non-root uid in group root, like OpenShift runs containers
readonly OPENSHIFT_USER="1000890000:0"

PASSED=0
FAILED=0
CONTAINERS=()

cleanup() {
    for c in "${CONTAINERS[@]}"; do
        docker rm -f "$c" > /dev/null 2>&1
    done
}
trap cleanup EXIT

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

# report <status> <description> [details]
report() {
    local status="$1" description="$2" details="${3:-}"
    if [ "$status" = "$STATUS_PASS" ]; then
        PASSED=$((PASSED + 1))
        echo "  [${STATUS_PASS}] ${description}"
    else
        FAILED=$((FAILED + 1))
        echo "  [${STATUS_FAIL}] ${description}"
    fi
    if [ -n "$details" ]; then
        echo "$details" | sed 's/^/           | /'
    fi
}

# check <description> <expected substring> <container> <command...>
check() {
    local description="$1" expected="$2" container="$3"
    shift 3
    local output
    output=$(docker exec "$container" "$@" 2>&1)
    if echo "$output" | grep -qF -- "$expected"; then
        report "$STATUS_PASS" "$description"
    else
        report "$STATUS_FAIL" "$description" "expected to contain: ${expected}"$'\n'"got: ${output}"
    fi
}

# check_absent <description> <unexpected substring> <container> <command...>
check_absent() {
    local description="$1" unexpected="$2" container="$3"
    shift 3
    local output
    output=$(docker exec "$container" "$@" 2>&1)
    if echo "$output" | grep -qF -- "$unexpected"; then
        report "$STATUS_FAIL" "$description" "must not contain: ${unexpected}"$'\n'"got: ${output}"
    else
        report "$STATUS_PASS" "$description"
    fi
}

# start_container <name suffix> [docker run args...] - prints container name
start_container() {
    local name="${CONTAINER_PREFIX}-$1"
    shift
    docker run -d --name "$name" "$@" "$IMAGE" > /dev/null || return 1
    echo "$name"
}

# wait_for <container> <expected substring> <command...>
wait_for() {
    local container="$1" expected="$2"
    shift 2
    local waited=0
    while [ "$waited" -lt "$STARTUP_TIMEOUT" ]; do
        if docker exec "$container" "$@" 2>/dev/null | grep -qF -- "$expected"; then
            return 0
        fi
        sleep "$POLL_INTERVAL"
        waited=$((waited + POLL_INTERVAL))
    done
    log "timeout after ${STARTUP_TIMEOUT}s waiting for '${expected}' from: $*"
    return 1
}

supervisor_status() {
    docker exec "$1" supervisorctl -c /lowcoder/etc/supervisord.conf status 2>&1
}

# wait_for_running <container> <programs> - supervisor reports RUNNING only after startsecs
wait_for_running() {
    local container="$1" programs="$2" waited=0 status program pending
    while [ "$waited" -lt "$STARTUP_TIMEOUT" ]; do
        status=$(supervisor_status "$container")
        pending=""
        for program in $programs; do
            echo "$status" | grep -qE "^${program}[[:space:]]+RUNNING" || pending="${pending} ${program}"
        done
        [ -z "$pending" ] && return 0
        sleep "$POLL_INTERVAL"
        waited=$((waited + POLL_INTERVAL))
    done
    log "timeout after ${STARTUP_TIMEOUT}s waiting for RUNNING state of:${pending}"
    return 1
}

check_programs_running() {
    local container="$1" programs="$2" status program
    status=$(supervisor_status "$container")
    for program in $programs; do
        if echo "$status" | grep -qE "^${program}[[:space:]]+RUNNING"; then
            report "$STATUS_PASS" "supervisor program '${program}' is RUNNING"
        else
            report "$STATUS_FAIL" "supervisor program '${program}' is RUNNING" "$status"
        fi
    done
}

# check_program_user <container> <program> <expected user>
check_program_user() {
    local container="$1" program="$2" expected="$3" pid user
    pid=$(docker exec "$container" supervisorctl -c /lowcoder/etc/supervisord.conf pid "$program" 2>&1)
    user=$(docker exec "$container" stat -c %U "/proc/${pid}" 2>&1)
    if [ "$user" = "$expected" ]; then
        report "$STATUS_PASS" "'${program}' runs as user '${expected}'"
    else
        report "$STATUS_FAIL" "'${program}' runs as user '${expected}'" "pid: ${pid}, user: ${user}"
    fi
}

dump_logs() {
    local container="$1" program
    log "container logs of ${container}:"
    docker logs "$container" 2>&1 | tail -40 | sed 's/^/    /'
    for program in $PROGRAMS_DEFAULT; do
        echo "    --- /lowcoder-stacks/logs/${program}/${program}.log (tail)"
        docker exec "$container" tail -15 "/lowcoder-stacks/logs/${program}/${program}.log" 2>&1 | sed 's/^/    /'
    done
}

##
## Scenario 1: default configuration, all services enabled
##
scenario_default() {
    log "Scenario 1: all services enabled (image: ${IMAGE})"
    local c
    c=$(start_container default \
        -e LOWCODER_AGORA_APP_ID="$DUMMY_AGORA_APP_ID" \
        -e LOWCODER_AGORA_APP_CERTIFICATE="$DUMMY_AGORA_APP_CERTIFICATE") || { report "$STATUS_FAIL" "container starts"; return; }
    CONTAINERS+=("$c")

    log "waiting for api-service (needs mongodb and redis)..."
    if ! wait_for "$c" "$MSG_API_UP" curl -sS "$URL_API_SERVICE"; then
        report "$STATUS_FAIL" "api-service became ready"
        dump_logs "$c"
    fi
    wait_for "$c" "$MSG_NODE_UP" curl -sS "$URL_NODE_SERVICE"
    wait_for "$c" "$MSG_PROXY_UP" curl -sS "$URL_PROXY_SERVICE"
    wait_for_running "$c" "$PROGRAMS_DEFAULT"

    check_programs_running "$c" "$PROGRAMS_DEFAULT"

    check "system node is ${REQUIRED_NODE_MAJOR}" "$REQUIRED_NODE_MAJOR" "$c" node --version

    # existing services keep working on the new node version
    check "api-service responds" "$MSG_API_UP" "$c" curl -sS "$URL_API_SERVICE"
    check "node-service responds" "$MSG_NODE_UP" "$c" curl -sS "$URL_NODE_SERVICE"
    check "frontend serves the client" "<html" "$c" curl -sS "$URL_FRONTEND/"

    # proxy-service, directly and through nginx
    check "proxy-service responds" "$MSG_PROXY_UP" "$c" curl -sS "$URL_PROXY_SERVICE/"
    check "nginx /proxy/ reaches proxy-service" "200" "$c" \
        curl -sS -o /dev/null -w "%{http_code}" "$URL_FRONTEND/proxy/typeform-bridge.js"
    check_absent "nginx server.conf has no unresolved placeholders" "__LOWCODER_" "$c" \
        cat /etc/nginx/server.conf
    check "nginx proxy_pass points to proxy-service" "proxy_pass http://localhost:6070;" "$c" \
        cat /etc/nginx/server.conf

    # hocuspocus, HTTP and websocket upgrade
    check "hocuspocus /health is ok" '"status":"ok"' "$c" curl -sS "$URL_HOCUSPOCUS/health"
    check "hocuspocus authentication disabled by default" '"auth":"disabled"' "$c" curl -sS "$URL_HOCUSPOCUS/health"
    check "hocuspocus accepts websocket upgrade" "101 Switching Protocols" "$c" \
        curl -sS -i --max-time 3 \
            -H "Connection: Upgrade" -H "Upgrade: websocket" \
            -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
            "$URL_HOCUSPOCUS/smoke-test-room"

    # agora token service, port and env mapping
    check "agora token service /ping answers pong" "pong" "$c" curl -sS "$URL_AGORA/ping"
    check "agora token service default CORS origin is *" "Access-Control-Allow-Origin: *" "$c" \
        curl -sS -i "$URL_AGORA/ping"
    check "agora token service issues tokens with LOWCODER_AGORA_* credentials" '"rtcToken":"' "$c" \
        curl -sS "$URL_AGORA/rte/smoke-channel/publisher/uid/1"

    # privileges dropped by entrypoints
    for program in $PROGRAMS_NEW; do
        check_program_user "$c" "$program" "lowcoder"
    done

    # log files go to the stacks volume
    for program in $PROGRAMS_NEW; do
        check "'${program}' writes its log file" "Running Lowcoder" "$c" \
            cat "/lowcoder-stacks/logs/${program}/${program}.log"
    done

    [ "$FAILED" -gt 0 ] && dump_logs "$c"
}

##
## Scenario 2: the new services disabled
##
scenario_disabled() {
    log "Scenario 2: new services disabled"
    local c status program
    c=$(start_container disabled \
        -e LOWCODER_PROXY_SERVICE_ENABLED=false \
        -e LOWCODER_HOCUSPOCUS_ENABLED=false \
        -e LOWCODER_AGORA_TOKEN_SERVICE_ENABLED=false) || { report "$STATUS_FAIL" "container starts"; return; }
    CONTAINERS+=("$c")

    sleep "$DISABLED_STARTUP_WAIT"
    wait_for_running "$c" "redis mongodb frontend"
    status=$(supervisor_status "$c")
    for program in $PROGRAMS_NEW; do
        if echo "$status" | grep -qE "^${program}[[:space:]]"; then
            report "$STATUS_FAIL" "'${program}' is not started when disabled" "$status"
        else
            report "$STATUS_PASS" "'${program}' is not started when disabled"
        fi
    done
    check_programs_running "$c" "redis mongodb frontend"
    check "nothing listens on hocuspocus port" "000" "$c" \
        curl -sS -o /dev/null -w "%{http_code}" "$URL_HOCUSPOCUS/health"
    check "nothing listens on agora port" "000" "$c" \
        curl -sS -o /dev/null -w "%{http_code}" "$URL_AGORA/ping"
    check "nothing listens on proxy-service port" "000" "$c" \
        curl -sS -o /dev/null -w "%{http_code}" "$URL_PROXY_SERVICE/"
}

##
## Scenario 3: arbitrary non-root user (OpenShift)
##
scenario_openshift() {
    log "Scenario 3: running as ${OPENSHIFT_USER} (OpenShift)"
    local c
    c=$(start_container openshift --user "$OPENSHIFT_USER") || { report "$STATUS_FAIL" "container starts"; return; }
    CONTAINERS+=("$c")

    if ! wait_for "$c" "$MSG_PROXY_UP" curl -sS "$URL_PROXY_SERVICE"; then
        dump_logs "$c"
    fi
    wait_for "$c" '"status":"ok"' curl -sS "$URL_HOCUSPOCUS/health"
    wait_for "$c" "pong" curl -sS "$URL_AGORA/ping"
    wait_for_running "$c" "$PROGRAMS_NEW"
    check_programs_running "$c" "$PROGRAMS_NEW"
    check "hocuspocus /health is ok" '"status":"ok"' "$c" curl -sS "$URL_HOCUSPOCUS/health"
    check "agora token service /ping answers pong" "pong" "$c" curl -sS "$URL_AGORA/ping"
    check "proxy-service responds" "$MSG_PROXY_UP" "$c" curl -sS "$URL_PROXY_SERVICE/"
}

scenario_default
scenario_disabled
scenario_openshift

echo
log "Result: ${PASSED} passed, ${FAILED} failed"
[ "$FAILED" -eq 0 ]
