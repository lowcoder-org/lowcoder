#!/bin/bash

##
## Runtime test of the services the Lowcoder Helm chart adds (proxy-service, hocuspocus,
## agora-token-service), outside Kubernetes.
##
## Renders the chart with an ingress host, then starts each new service's image in Docker with
## exactly the environment its Deployment gets (ConfigMap/Secret via envFrom plus env), reachable
## under its Service name. An nginx container generated from the rendered Ingress rule stands in
## for ingress-nginx (pathType Prefix as "location = <path>" plus "location <path>/", websocket
## upgrade headers, no rewrite) under the ingress host name. Checks: every readiness/liveness
## probe answers on the rendered port and path; two Yjs clients sync a document through the
## ingress at the hocuspocus URL the chart renders for proxy-service, a wrong token is refused;
## /rte through the ingress returns Agora tokens; agora-token-service rendered without
## credentials answers 400.
##
## With RUNTIME_FRONTEND_IMAGE set, the frontend is started from that image (instead of the chart's
## appVersion image, whose nginx has no /hocuspocus or /agora-token-service/ location) with the
## frontend Deployment's environment, and the same hocuspocus and Agora checks run through its
## nginx (/hocuspocus, /agora-token-service/rte/...). api-service and node-service are not started;
## their Service names only resolve (nginx needs every upstream host at startup).
##
## Usage (from project root):
##   [RUNTIME_FRONTEND_IMAGE=<image>] deploy/helm/tests/runtime-test.sh [image tag of the new services, default dev] [chart directory]
##
## Requires: docker, helm 3, yq v4 (mikefarah), network access to Docker Hub, the Bitnami OCI
## registry and registry.npmjs.org (the Yjs client is installed into a node container).
##
## Not covered: Kubernetes itself (scheduling, kube-proxy, probes run by the kubelet, Service
## port 80 -> targetPort mapping is resolved by this script, not exercised), ingress controllers
## other than this nginx emulation of ingress-nginx, api-service / node-service (not started:
## proxy-service is only checked for its own probe), the frontend without RUNTIME_FRONTEND_IMAGE,
## TLS (wss://), and the ChatBox component in a browser (the frontend image has its hocuspocus URL
## baked in at build time).
##

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly IMAGE_TAG="${1:-dev}"
readonly CHART_SOURCE="${2:-${SCRIPT_DIR}/..}"
readonly FRONTEND_IMAGE="${RUNTIME_FRONTEND_IMAGE:-}"

readonly RELEASE="my-lowcoder"
readonly NAMESPACE="lowcoder"
readonly NEW_SERVICES="proxy-service hocuspocus agora-token-service"
readonly FRONTEND="${RELEASE}-frontend"
# Upstreams of the frontend nginx that are not started; they only need to resolve
readonly UNSTARTED_UPSTREAMS="${RELEASE}-api-service ${RELEASE}-node-service"

readonly INGRESS_HOST="lowcoder.test"
readonly INGRESS_PORT="80"
readonly HOCUSPOCUS_SECRET="hocuspocus-secret-91c2"
readonly WRONG_HOCUSPOCUS_SECRET="not-the-secret"
readonly HOCUSPOCUS_DOCUMENT="runtime-test-room"
readonly FRONTEND_HOCUSPOCUS_PATH="/hocuspocus"
readonly FRONTEND_AGORA_PREFIX="/agora-token-service"
# Dummy 32-hex credentials: the token service only needs the format to build tokens
readonly AGORA_APP_ID="0123456789abcdef0123456789abcdef"
readonly AGORA_CERTIFICATE="fedcba9876543210fedcba9876543210"
readonly AGORA_TOKEN_PATH="/rte/runtime-test/publisher/uid/1"
# Agora AccessToken2 tokens start with their version
readonly AGORA_TOKEN_VERSION="007"
readonly AGORA_MISSING_CREDENTIALS="APP_ID and APP_CERTIFICATE must be set"

readonly HTTP_OK="200"
readonly HTTP_BAD_REQUEST="400"
# Answer of an ingress location whose service is not started (the frontend without RUNTIME_FRONTEND_IMAGE)
readonly HTTP_NOT_STARTED="418"

readonly NGINX_IMAGE="nginx:1.30.5-alpine"
readonly CURL_IMAGE="curlimages/curl:7.87.0"
readonly NODE_IMAGE="node:22.23-slim"
# The versions the lowcoder client resolves (client/yarn.lock)
readonly HOCUSPOCUS_PROVIDER_VERSION="3.4.4"
readonly YJS_VERSION="13.6.27"
readonly WS_VERSION="8.18.3"

readonly STARTUP_TIMEOUT=90
readonly POLL_INTERVAL=2

readonly CONTAINER_PREFIX="lowcoder-helm-runtime-$$"
readonly NETWORK="${CONTAINER_PREFIX}"
readonly CURL_CONTAINER="${CONTAINER_PREFIX}-curl"
readonly INGRESS_CONTAINER="${CONTAINER_PREFIX}-ingress"
readonly AGORA_NO_CREDENTIALS_CONTAINER="${CONTAINER_PREFIX}-agora-no-credentials"

# shellcheck source-path=SCRIPTDIR source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

cleanup() {
    local containers
    mapfile -t containers < <(docker ps -aq --filter "name=^${CONTAINER_PREFIX}")
    [ "${#containers[@]}" -gt 0 ] && docker rm -f "${containers[@]}" > /dev/null
    docker network rm "$NETWORK" > /dev/null 2>&1
    cleanup_work_dir
}
trap cleanup EXIT

# container_field <file> <deployment> <yq path below the first container>
container_field() {
    field "$1" Deployment "$2" ".spec.template.spec.containers[0]$3"
}

# container_port <file> <deployment> <port name or number> - the containerPort it refers to
container_port() {
    if [[ "$3" =~ ^[0-9]+$ ]]; then
        echo "$3"
    else
        container_field "$1" "$2" ".ports[] | select(.name == \"$3\") | .containerPort"
    fi
}

# service_target <file> <service> <service port> - "<service>:<container port>" the Service forwards to
# (the chart names each Deployment like its Service)
service_target() {
    local target
    target=$(field "$1" Service "$2" ".spec.ports[] | select(.port == $3) | .targetPort")
    echo "$2:$(container_port "$1" "$2" "$target")"
}

# write_env_file <file> <deployment> <env file> - the environment of the Deployment's container:
# every ConfigMap/Secret of envFrom, then env (later entries win, as in Kubernetes)
write_env_file() {
    local manifests="$1" deployment="$2" env_file="$3" source
    : > "$env_file"
    for source in $(container_field "$manifests" "$deployment" '.envFrom[] | (.configMapRef.name // .secretRef.name)'); do
        yq -N "select(.kind == \"ConfigMap\" and .metadata.name == \"${source}\") | (.data // {}) | to_entries | .[] | .key + \"=\" + (.value | tostring)" "$manifests" >> "$env_file"
        yq -N "select(.kind == \"Secret\" and .metadata.name == \"${source}\") | ((.data // {}) | to_entries | .[] | .key + \"=\" + (.value | @base64d)), ((.stringData // {}) | to_entries | .[] | .key + \"=\" + (.value | tostring))" "$manifests" >> "$env_file"
    done
    container_field "$manifests" "$deployment" '.env[] | .name + "=" + (.value // "" | tostring)' >> "$env_file"
    sed -i '/^$/d' "$env_file"
    map_service_ports "$manifests" "$env_file"
}

# map_service_ports <file> <env file> - rewrites "://<service>:<service port>" to the container port
# the Service targets: kube-proxy does that mapping in Kubernetes, here containers are reached directly
map_service_ports() {
    local manifests="$1" env_file="$2" entry service port target
    for entry in $(yq -N 'select(.kind == "Service") | .metadata.name + "|" + (.spec.ports[] | .port | tostring)' "$manifests"); do
        IFS='|' read -r service port <<< "$entry"
        target=$(service_target "$manifests" "$service" "$port")
        # Services without a Deployment of the same name (Bitnami subcharts) are left as they are
        [ "$target" = "${service}:" ] && continue
        sed -i -E "s#://${service}:${port}([/\"]|\$)#://${target}\\1#g" "$env_file"
    done
}

# is_started <deployment> - its container (named after it) is running
is_started() {
    docker ps -q --filter "name=^${CONTAINER_PREFIX}-${1}$" | grep -q .
}

# start_service <file> <deployment> [container name] [image] - runs the Deployment's image (or the
# given one) with its env, reachable on the network under the Deployment (= Service) name
start_service() {
    local manifests="$1" deployment="$2" container="${3:-${CONTAINER_PREFIX}-${2}}" image="${4:-}"
    local env_file="${WORK_DIR}/${container}.env"
    [ -z "$image" ] && image=$(container_field "$manifests" "$deployment" '.image')
    write_env_file "$manifests" "$deployment" "$env_file"
    # a local image (e.g. RUNTIME_FRONTEND_IMAGE) is used as it is
    if ! docker image inspect "$image" > /dev/null 2>&1 && ! docker pull -q "$image" > "${WORK_DIR}/${container}.pull" 2>&1; then
        report "$STATUS_FAIL" "pull ${image}" "$(cat "${WORK_DIR}/${container}.pull")"
        return 1
    fi
    report "$STATUS_PASS" "image ${image}"
    local alias_args=()
    [ "$container" = "${CONTAINER_PREFIX}-${deployment}" ] && alias_args=(--network-alias "$deployment")
    if ! docker run -d --name "$container" --network "$NETWORK" "${alias_args[@]}" --env-file "$env_file" "$image" \
        > "${WORK_DIR}/${container}.run" 2>&1; then
        report "$STATUS_FAIL" "start ${deployment}" "$(cat "${WORK_DIR}/${container}.run")"
        return 1
    fi
}

# http_get <url> [curl args...] - prints "<status> <body>" as seen from inside the network
http_get() {
    local url="$1"
    shift
    docker exec "$CURL_CONTAINER" curl -s --max-time 5 -o /tmp/body -w '%{http_code}' "$@" "$url" 2>/dev/null
    echo -n " "
    docker exec "$CURL_CONTAINER" cat /tmp/body 2>/dev/null
}

# wait_for_status <url> <status> - polls until the URL answers with the status, STARTUP_TIMEOUT
# seconds of wall-clock time at most
wait_for_status() {
    local url="$1" expected="$2" deadline=$((SECONDS + STARTUP_TIMEOUT))
    while [ "$SECONDS" -lt "$deadline" ]; do
        [ "$(http_get "$url" | cut -d' ' -f1)" = "$expected" ] && return 0
        sleep "$POLL_INTERVAL"
    done
    return 1
}

# check_probes <file> <deployment> - the readiness and liveness probe answer 2xx on the rendered port
check_probes() {
    local manifests="$1" deployment="$2" probe path port url
    if ! is_started "$deployment"; then
        report "$STATUS_FAIL" "${deployment} probes" "container not started"
        return
    fi
    for probe in readinessProbe livenessProbe; do
        path=$(container_field "$manifests" "$deployment" ".${probe}.httpGet.path")
        port=$(container_port "$manifests" "$deployment" "$(container_field "$manifests" "$deployment" ".${probe}.httpGet.port")")
        url="http://${deployment}:${port}${path}"
        if wait_for_status "$url" "$HTTP_OK"; then
            report "$STATUS_PASS" "${deployment} ${probe} ${port}${path}: $(http_get "$url" | cut -d' ' -f2- | head -c 160)"
        else
            report "$STATUS_FAIL" "${deployment} ${probe} ${port}${path}" \
                "last answer: $(http_get "$url")"$'\n'"logs: $(docker logs --tail 20 "${CONTAINER_PREFIX}-${deployment}" 2>&1)"
        fi
    done
}

# write_ingress_conf <file> <nginx conf> - ingress-nginx emulation of the Ingress rule of INGRESS_HOST
write_ingress_conf() {
    local manifests="$1" conf="$2" entry path path_type service port target
    cat > "$conf" <<EOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}
server {
    listen ${INGRESS_PORT};
    server_name ${INGRESS_HOST};
    resolver 127.0.0.11 valid=10s;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
EOF
    for entry in $(yq -N "select(.kind == \"Ingress\") | .spec.rules[] | select(.host == \"${INGRESS_HOST}\") | .http.paths[] | .path + \"|\" + (.pathType // \"ImplementationSpecific\") + \"|\" + .backend.service.name + \"|\" + (.backend.service.port.number | tostring)" "$manifests"); do
        IFS='|' read -r path path_type service port <<< "$entry"
        local body
        if is_started "$service"; then
            target=$(service_target "$manifests" "$service" "$port")
            body="set \$upstream http://${target}; proxy_pass \$upstream;"
        else
            body="return ${HTTP_NOT_STARTED};"
        fi
        if [ "$path_type" = "Prefix" ] && [ "$path" != "/" ]; then
            echo "    location = ${path} { ${body} }" >> "$conf"
            echo "    location ${path%/}/ { ${body} }" >> "$conf"
        elif [ "$path_type" = "Exact" ]; then
            echo "    location = ${path} { ${body} }" >> "$conf"
        else
            echo "    location ${path} { ${body} }" >> "$conf"
        fi
    done
    echo "}" >> "$conf"
}

# Installs the Yjs client next to hocuspocus-sync.mjs in WORK_DIR/client
install_hocuspocus_client() {
    local client_dir="${WORK_DIR}/client"
    mkdir -p "$client_dir"
    cp "${SCRIPT_DIR}/runtime/hocuspocus-sync.mjs" "$client_dir/"
    docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache \
        -v "${client_dir}:/client" -w /client "$NODE_IMAGE" \
        sh -c "npm init -y > /dev/null && npm install --no-audit --no-fund @hocuspocus/provider@${HOCUSPOCUS_PROVIDER_VERSION} yjs@${YJS_VERSION} ws@${WS_VERSION}" \
        > "${WORK_DIR}/npm.log" 2>&1
}

# run_hocuspocus_client <mode> <url> <token> - runs hocuspocus-sync.mjs on the network
run_hocuspocus_client() {
    docker run --rm --network "$NETWORK" -v "${WORK_DIR}/client:/client:ro" -w /client "$NODE_IMAGE" \
        node hocuspocus-sync.mjs "$1" "$2" "$3" "$HOCUSPOCUS_DOCUMENT" 2>&1
}

# check_hocuspocus_sync <url> - two clients sync a document via the URL, a wrong token is refused
check_hocuspocus_sync() {
    local url="$1" output
    if output=$(run_hocuspocus_client sync "$url" "$HOCUSPOCUS_SECRET"); then
        report "$STATUS_PASS" "two clients sync a document via ${url}" "$output"
    else
        report "$STATUS_FAIL" "two clients sync a document via ${url}" \
            "$output"$'\n'"hocuspocus logs: $(docker logs --tail 20 "${CONTAINER_PREFIX}-${RELEASE}-hocuspocus" 2>&1)"
    fi
    if output=$(run_hocuspocus_client reject "$url" "$WRONG_HOCUSPOCUS_SECRET"); then
        report "$STATUS_PASS" "client with a wrong token is refused via ${url}" "$output"
    else
        report "$STATUS_FAIL" "client with a wrong token is refused via ${url}" "$output"
    fi
}

# check_agora_tokens <url> - the URL answers 200 with an RTC and an RTM token
check_agora_tokens() {
    local url="$1" answer body
    answer=$(http_get "$url")
    body=${answer#* }
    check_eq "GET ${url} status" "$HTTP_OK" "${answer%% *}"
    check_eq "rtcToken is an Agora ${AGORA_TOKEN_VERSION} token" "$AGORA_TOKEN_VERSION" \
        "$(echo "$body" | yq -p json '.rtcToken // ""' 2>/dev/null | head -c ${#AGORA_TOKEN_VERSION})"
    check_eq "rtmToken is an Agora ${AGORA_TOKEN_VERSION} token" "$AGORA_TOKEN_VERSION" \
        "$(echo "$body" | yq -p json '.rtmToken // ""' 2>/dev/null | head -c ${#AGORA_TOKEN_VERSION})"
}

render_runtime_manifests() {
    log "rendering the chart with ingress host ${INGRESS_HOST}, image tag ${IMAGE_TAG}"
    local common=(
        --set ingress.enabled=true
        # --set of a list element replaces the list: the frontend path of values.yaml is repeated
        --set "ingress.hosts[0].host=${INGRESS_HOST}"
        --set "ingress.hosts[0].paths[0].path=/"
        --set "ingress.hosts[0].paths[0].pathType=ImplementationSpecific"
        --set "hocuspocus.secret=${HOCUSPOCUS_SECRET}"
        --set "proxyService.image.tag=${IMAGE_TAG}"
        --set "hocuspocus.image.tag=${IMAGE_TAG}"
        --set "agoraTokenService.image.tag=${IMAGE_TAG}"
    )
    check_render "render with ingress, hocuspocus secret and Agora credentials" "${WORK_DIR}/runtime.yaml" \
        "${common[@]}" --set "agoraTokenService.appId=${AGORA_APP_ID}" --set "agoraTokenService.appCertificate=${AGORA_CERTIFICATE}"
    check_render "render without Agora credentials" "${WORK_DIR}/no-credentials.yaml" "${common[@]}"
}

start_services() {
    log "starting the new services with their rendered environment"
    local manifests="${WORK_DIR}/runtime.yaml" service
    docker network create "$NETWORK" > /dev/null
    local alias_args=() upstream
    for upstream in $UNSTARTED_UPSTREAMS; do
        alias_args+=(--network-alias "$upstream")
    done
    docker run -d --name "$CURL_CONTAINER" --network "$NETWORK" "${alias_args[@]}" \
        --entrypoint sleep "$CURL_IMAGE" infinity > /dev/null
    for service in $NEW_SERVICES; do
        start_service "$manifests" "${RELEASE}-${service}"
    done
    start_service "${WORK_DIR}/no-credentials.yaml" "${RELEASE}-agora-token-service" "$AGORA_NO_CREDENTIALS_CONTAINER"
    if [ -n "$FRONTEND_IMAGE" ]; then
        log "starting the frontend from ${FRONTEND_IMAGE} with its rendered environment"
        start_service "$manifests" "$FRONTEND" "" "$FRONTEND_IMAGE"
    fi
}

test_probes() {
    log "probes on the rendered ports"
    local manifests="${WORK_DIR}/runtime.yaml" service
    for service in $NEW_SERVICES; do
        check_probes "$manifests" "${RELEASE}-${service}"
    done
    [ -n "$FRONTEND_IMAGE" ] && check_probes "$manifests" "$FRONTEND"
    local health
    health=$(http_get "http://${RELEASE}-hocuspocus:$(container_port "$manifests" "${RELEASE}-hocuspocus" hocuspocus)/health" | cut -d' ' -f2-)
    check_eq "hocuspocus received its secret (auth state)" "enabled" "$(echo "$health" | yq -p json '.auth' 2>/dev/null)"
}

start_ingress() {
    log "starting the ingress-nginx emulation"
    local conf="${WORK_DIR}/ingress.conf"
    write_ingress_conf "${WORK_DIR}/runtime.yaml" "$conf"
    sed 's/^/    nginx: /' "$conf"
    docker run -d --name "$INGRESS_CONTAINER" --network "$NETWORK" --network-alias "$INGRESS_HOST" \
        -v "${conf}:/etc/nginx/conf.d/default.conf:ro" "$NGINX_IMAGE" > /dev/null
    local expected="$HTTP_NOT_STARTED"
    is_started "$FRONTEND" && expected="$HTTP_OK"
    if wait_for_status "http://${INGRESS_HOST}/" "$expected"; then
        report "$STATUS_PASS" "ingress emulation up (frontend path answers ${expected})"
    else
        report "$STATUS_FAIL" "ingress emulation up" "$(docker logs "$INGRESS_CONTAINER" 2>&1 | tail -20)"
    fi
}

test_hocuspocus_through_ingress() {
    log "hocuspocus websocket through the ingress"
    local url
    url=$(env_value "${WORK_DIR}/runtime.yaml" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_URL)
    check_eq "rendered hocuspocus URL of proxy-service" "ws://${INGRESS_HOST}/hocuspocus" "$url"
    check_hocuspocus_sync "$url"
}

test_agora_through_ingress() {
    log "agora-token-service through the ingress"
    check_agora_tokens "http://${INGRESS_HOST}${AGORA_TOKEN_PATH}"

    local manifests="${WORK_DIR}/no-credentials.yaml" port answer
    port=$(container_port "$manifests" "${RELEASE}-agora-token-service" agora-token)
    local url="http://${AGORA_NO_CREDENTIALS_CONTAINER}:${port}${AGORA_TOKEN_PATH}"
    if ! is_started "${AGORA_NO_CREDENTIALS_CONTAINER#"${CONTAINER_PREFIX}-"}"; then
        report "$STATUS_FAIL" "without credentials" "container not started"
        return
    fi
    wait_for_status "http://${AGORA_NO_CREDENTIALS_CONTAINER}:${port}/ping" "$HTTP_OK"
    answer=$(http_get "$url")
    check_eq "without credentials: status" "$HTTP_BAD_REQUEST" "${answer%% *}"
    check_eq "without credentials: message" "$AGORA_MISSING_CREDENTIALS" \
        "$(echo "${answer#* }" | yq -p json '.message // ""' 2>/dev/null)"
}

test_frontend_routes() {
    log "hocuspocus and agora-token-service through the frontend nginx (${FRONTEND_IMAGE})"
    local manifests="${WORK_DIR}/runtime.yaml" frontend_url
    check_eq "frontend gets the hocuspocus Service URL" "http://${RELEASE}-hocuspocus:80" \
        "$(env_value "$manifests" "$FRONTEND" LOWCODER_HOCUSPOCUS_SERVICE_URL)"
    check_eq "frontend gets the agora-token-service Service URL" "http://${RELEASE}-agora-token-service:80" \
        "$(env_value "$manifests" "$FRONTEND" LOWCODER_AGORA_TOKEN_SERVICE_URL)"
    # the frontend container port, as a kubectl port-forward to the pod would reach it
    frontend_url="${FRONTEND}:$(container_port "$manifests" "$FRONTEND" lowcoder)"
    check_hocuspocus_sync "ws://${frontend_url}${FRONTEND_HOCUSPOCUS_PATH}"
    check_agora_tokens "http://${frontend_url}${FRONTEND_AGORA_PREFIX}${AGORA_TOKEN_PATH}"
}

require_commands docker helm yq

prepare_chart
render_runtime_manifests
start_services
test_probes
start_ingress
if install_hocuspocus_client; then
    test_hocuspocus_through_ingress
else
    report "$STATUS_FAIL" "install the Yjs client" "$(tail -20 "${WORK_DIR}/npm.log")"
fi
test_agora_through_ingress
[ -n "$FRONTEND_IMAGE" ] && test_frontend_routes

print_result
