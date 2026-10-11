#!/bin/bash

##
## Render test of the Lowcoder Helm chart.
##
## Copies the chart to a temporary directory, builds its dependencies, lints it and renders it
## with `helm template` in many configurations, checking the rendered manifests with yq and
## kubeconform. Nothing is installed: it needs no cluster.
##
## Usage (from project root):
##   deploy/helm/tests/render-test.sh [chart directory]
##
## Requires: helm 3, kubeconform, yq v4 (mikefarah), network access to the Bitnami OCI registry.
##
## Not covered: anything at runtime (pods starting, probes answering, ingress controllers
## routing, lookup of existing Secrets - lookup returns nothing under helm template).
##

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly CHART_SOURCE="${1:-${SCRIPT_DIR}/..}"

readonly RELEASE="my-lowcoder"
readonly NAMESPACE="lowcoder"
readonly OTHER_RELEASE="foo"

readonly NEW_SERVICES="proxy-service hocuspocus agora-token-service"
readonly NEW_SERVICE_TAG="latest"
readonly PROXY_PORT="6070"
readonly HOCUSPOCUS_PORT="3006"
readonly AGORA_PORT="8080"

readonly INGRESS_HOST="lowcoder.example.com"
readonly SECOND_HOST="second.example.com"
readonly HOCUSPOCUS_PATH="/hocuspocus"
readonly AGORA_PATH="/rte"
readonly PUBLIC_HOCUSPOCUS_URL="wss://collab.example.com/hocuspocus"

# Distinct values, so a grep over all manifests finds exactly where they ended up
readonly SMTP_PASSWORD="smtp-password-7f3a"
readonly HOCUSPOCUS_SECRET="hocuspocus-secret-91c2"
readonly AGORA_APP_ID="0123456789abcdef0123456789abcdef"
readonly AGORA_CERTIFICATE="fedcba9876543210fedcba9876543210"
readonly API_KEY_SECRET="api-key-secret-5d1e"
# Reserved characters of a URL user/password part, with their RFC 3986 encoding
readonly SPECIAL_PASSWORD="p@ss:w/rd +x%"
readonly SPECIAL_PASSWORD_ENCODED="p%40ss%3Aw%2Frd%20%2Bx%25"

readonly EXTERNAL_REDIS_HOST="redis.example.com:6379"
readonly EXTERNAL_REDIS_URL="redis://user:pw@redis.example.com:6380/2"
readonly EXTERNAL_REDISS_URL="rediss://redis.example.com:6380"
readonly EXTERNAL_MONGO_HOST="mongo.example.com:27017"
# mongodb.service.nameOverride of values.yaml
readonly MONGO_SERVICE="lowcoder-mongodb"

# shellcheck source-path=SCRIPTDIR source=lib.sh
source "${SCRIPT_DIR}/lib.sh"
trap cleanup_work_dir EXIT

# kinds_containing <file> <text> - sorted kinds of all objects whose YAML contains text
kinds_containing() {
    yq -N "select(. | to_yaml | contains(\"$2\")) | .kind" "$1" 2>/dev/null | sed '/^$/d' | sort -u | tr '\n' ' ' | sed 's/ $//'
}

# object_names <file> <kind> - sorted names of all objects of a kind
object_names() {
    yq -N "select(.kind == \"$2\") | .metadata.name" "$1" 2>/dev/null | sed '/^$/d' | sort | tr '\n' ' ' | sed 's/ $//'
}

test_lint_and_schema() {
    log "lint and schema of the default render"
    if helm lint "$CHART" > "${WORK_DIR}/lint.log" 2>&1; then
        report "$STATUS_PASS" "helm lint"
    else
        report "$STATUS_FAIL" "helm lint" "$(cat "${WORK_DIR}/lint.log")"
    fi
    local out="${WORK_DIR}/default.yaml"
    check_render "default values render" "$out"
    local schema
    schema=$(kubeconform -strict -summary -ignore-missing-schemas "$out" 2>&1)
    if echo "$schema" | grep -q "Invalid: 0, Errors: 0"; then
        report "$STATUS_PASS" "kubeconform -strict: $(echo "$schema" | tail -1)"
    else
        report "$STATUS_FAIL" "kubeconform -strict" "$schema"
    fi
}

test_new_services_default() {
    log "new services in the default render"
    local out="${WORK_DIR}/default.yaml"
    check_eq "Deployments of all services" \
        "${RELEASE}-agora-token-service ${RELEASE}-api-service ${RELEASE}-frontend ${RELEASE}-hocuspocus ${RELEASE}-node-service ${RELEASE}-proxy-service" \
        "$(object_names "$out" Deployment | tr ' ' '\n' | grep -v -- '-mongodb\|-redis' | tr '\n' ' ' | sed 's/ $//')"

    check_eq "proxy-service image" "lowcoderorg/lowcoder-proxy-service:${NEW_SERVICE_TAG}" \
        "$(field "$out" Deployment "${RELEASE}-proxy-service" '.spec.template.spec.containers[0].image')"
    check_eq "proxy-service port" "$PROXY_PORT" \
        "$(field "$out" Deployment "${RELEASE}-proxy-service" '.spec.template.spec.containers[0].ports[0].containerPort')"
    check_eq "proxy-service PROXY_SERVICE_PORT" "$PROXY_PORT" "$(env_value "$out" "${RELEASE}-proxy-service" PROXY_SERVICE_PORT)"
    check_eq "proxy-service probe" "/" \
        "$(field "$out" Deployment "${RELEASE}-proxy-service" '.spec.template.spec.containers[0].readinessProbe.httpGet.path')"
    check_eq "proxy-service reaches api-service" "http://${RELEASE}-api-service:80" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_API_SERVICE_URL)"
    check_eq "proxy-service without ingress gets no hocuspocus URL" "" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_URL)"

    check_eq "hocuspocus image" "lowcoderorg/lowcoder-hocuspocus:${NEW_SERVICE_TAG}" \
        "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.template.spec.containers[0].image')"
    check_eq "hocuspocus port" "$HOCUSPOCUS_PORT" \
        "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.template.spec.containers[0].ports[0].containerPort')"
    check_eq "hocuspocus PORT env" "$HOCUSPOCUS_PORT" \
        "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.template.spec.containers[0].env[] | select(.name == "PORT") | .value')"
    check_eq "hocuspocus probe" "/health" \
        "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.template.spec.containers[0].readinessProbe.httpGet.path')"
    check_eq "hocuspocus single replica" "1" "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.replicas')"
    check_eq "hocuspocus Recreate strategy" "Recreate" "$(field "$out" Deployment "${RELEASE}-hocuspocus" '.spec.strategy.type')"

    check_eq "agora-token-service image" "lowcoderorg/lowcoder-agora-token-service:${NEW_SERVICE_TAG}" \
        "$(field "$out" Deployment "${RELEASE}-agora-token-service" '.spec.template.spec.containers[0].image')"
    check_eq "agora-token-service port" "$AGORA_PORT" \
        "$(field "$out" Deployment "${RELEASE}-agora-token-service" '.spec.template.spec.containers[0].ports[0].containerPort')"
    check_eq "agora-token-service SERVER_PORT" "$AGORA_PORT" "$(env_value "$out" "${RELEASE}-agora-token-service" SERVER_PORT)"
    check_eq "agora-token-service probe" "/ping" \
        "$(field "$out" Deployment "${RELEASE}-agora-token-service" '.spec.template.spec.containers[0].readinessProbe.httpGet.path')"
    check_eq "agora-token-service CORS default" "*" "$(env_value "$out" "${RELEASE}-agora-token-service" CORS_ALLOW_ORIGIN)"

    local service
    for service in $NEW_SERVICES; do
        local target port_name
        target=$(field "$out" Service "${RELEASE}-${service}" '.spec.ports[0].targetPort')
        port_name=$(field "$out" Deployment "${RELEASE}-${service}" '.spec.template.spec.containers[0].ports[0].name')
        check_same "${service} Service targets the container port name" "$port_name" "$target"
        check_same "${service} Service selects the Deployment's pods" \
            "$(field "$out" Deployment "${RELEASE}-${service}" '.spec.selector.matchLabels | to_json')" \
            "$(field "$out" Service "${RELEASE}-${service}" '.spec.selector | to_json')"
    done

    check_eq "frontend reaches proxy-service" "http://${RELEASE}-proxy-service:80" \
        "$(env_value "$out" "${RELEASE}-frontend" LOWCODER_PROXY_SERVICE_URL)"
    check_eq "frontend nginx reaches hocuspocus" "http://${RELEASE}-hocuspocus:80" \
        "$(env_value "$out" "${RELEASE}-frontend" LOWCODER_HOCUSPOCUS_SERVICE_URL)"
    check_eq "frontend nginx reaches agora-token-service" "http://${RELEASE}-agora-token-service:80" \
        "$(env_value "$out" "${RELEASE}-frontend" LOWCODER_AGORA_TOKEN_SERVICE_URL)"
    check_eq "SMTP port default" "587" "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_ADMIN_SMTP_PORT)"
    check_eq "redis image from bitnamilegacy" "docker.io/bitnamilegacy/redis:7.2.4-debian-12-r9" \
        "$(field "$out" StatefulSet "${RELEASE}-redis-master" '.spec.template.spec.containers[0].image')"
    check_eq "mongodb image from bitnamilegacy" "docker.io/bitnamilegacy/mongodb:7.0.8-debian-12-r2" \
        "$(field "$out" Deployment "${RELEASE}-mongodb" '.spec.template.spec.containers[0].image')"
}

test_secret_placement() {
    log "secrets only in Secrets"
    local out="${WORK_DIR}/secrets.yaml"
    check_render "render with secrets set" "$out" \
        --set global.mailServer.authPassword="$SMTP_PASSWORD" \
        --set hocuspocus.secret="$HOCUSPOCUS_SECRET" \
        --set agoraTokenService.appId="$AGORA_APP_ID" \
        --set agoraTokenService.appCertificate="$AGORA_CERTIFICATE" \
        --set global.config.apiKeySecret="$API_KEY_SECRET" \
        --set redis.auth.enabled=true --set-string redis.auth.password="$SPECIAL_PASSWORD"
    local value
    for value in "$SMTP_PASSWORD" "$HOCUSPOCUS_SECRET" "$AGORA_APP_ID" "$AGORA_CERTIFICATE" "$API_KEY_SECRET" "$SPECIAL_PASSWORD_ENCODED"; do
        local kinds
        kinds=$(kinds_containing "$out" "$value")
        # the Bitnami redis subchart keeps its own copy of the password in its Secret
        check_eq "'${value}' only in Secrets" "Secret" "$kinds"
    done
    check_eq "redis URL with encoded password" \
        "redis://:${SPECIAL_PASSWORD_ENCODED}@${RELEASE}-redis-master.${NAMESPACE}.svc.cluster.local:6379" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_REDIS_URL)"
    check_eq "proxy-service verifies tokens with the api key secret" "$API_KEY_SECRET" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_API_KEY_SECRET)"
    check_render_fails "proxy-service without api key secret fails" "set global.config.apiKeySecret" \
        --set global.config.apiKeySecret=""
    check_render "no api key secret, proxy-service disabled" "${WORK_DIR}/no-api-key.yaml" \
        --set global.config.apiKeySecret="" --set proxyService.enabled=false
    check_eq "proxy-service hands the hocuspocus secret to bridges" "$HOCUSPOCUS_SECRET" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_SECRET)"
    check_eq "hocuspocus gets the same secret" "$HOCUSPOCUS_SECRET" \
        "$(env_value "$out" "${RELEASE}-hocuspocus" HOCUSPOCUS_SECRET)"
    check_eq "agora gets its certificate" "$AGORA_CERTIFICATE" \
        "$(env_value "$out" "${RELEASE}-agora-token-service" APP_CERTIFICATE)"

    local default_checksum changed_checksum
    default_checksum=$(field "${WORK_DIR}/default.yaml" Deployment "${RELEASE}-api-service" '.spec.template.metadata.annotations."checksum/secret"')
    changed_checksum=$(field "$out" Deployment "${RELEASE}-api-service" '.spec.template.metadata.annotations."checksum/secret"')
    if [ -n "$default_checksum" ] && [ "$default_checksum" != "$changed_checksum" ]; then
        report "$STATUS_PASS" "changed Secret changes the api-service pod checksum"
    else
        report "$STATUS_FAIL" "changed Secret changes the api-service pod checksum" "default: ${default_checksum}"$'\n'"changed: ${changed_checksum}"
    fi
}

test_disable_each_service() {
    log "each new service disabled"
    local key service out
    for key in proxyService:proxy-service hocuspocus:hocuspocus agoraTokenService:agora-token-service; do
        service="${key#*:}"
        out="${WORK_DIR}/disabled-${service}.yaml"
        check_render "render with ${key%%:*}.enabled=false" "$out" \
            --set "${key%%:*}.enabled=false" --set ingress.enabled=true --set "ingress.hosts[0].host=${INGRESS_HOST}" \
            --set "ingress.hosts[0].paths[0].path=/" --set "ingress.hosts[0].paths[0].pathType=Prefix"
        check_eq "no object named *-${service}" "" "$(yq -N "select(.metadata.name == \"${RELEASE}-${service}\") | .kind" "$out" | sed '/^$/d' | sort -u | tr '\n' ' ' | sed 's/ $//')"
    done
    check_eq "proxy-service disabled: frontend gets no proxy URL" "" \
        "$(env_value "${WORK_DIR}/disabled-proxy-service.yaml" "${RELEASE}-frontend" LOWCODER_PROXY_SERVICE_URL)"
    check_eq "hocuspocus disabled: frontend gets no hocuspocus URL" "" \
        "$(env_value "${WORK_DIR}/disabled-hocuspocus.yaml" "${RELEASE}-frontend" LOWCODER_HOCUSPOCUS_SERVICE_URL)"
    check_eq "agora disabled: frontend gets no agora URL" "" \
        "$(env_value "${WORK_DIR}/disabled-agora-token-service.yaml" "${RELEASE}-frontend" LOWCODER_AGORA_TOKEN_SERVICE_URL)"
    check_eq "hocuspocus disabled: ingress has no ${HOCUSPOCUS_PATH}" \
        "${AGORA_PATH}:Prefix:${RELEASE}-agora-token-service /:Prefix:${RELEASE}-frontend" \
        "$(ingress_paths "${WORK_DIR}/disabled-hocuspocus.yaml" "$INGRESS_HOST")"
    check_eq "agora disabled: ingress has no ${AGORA_PATH}" \
        "${HOCUSPOCUS_PATH}:Prefix:${RELEASE}-hocuspocus /:Prefix:${RELEASE}-frontend" \
        "$(ingress_paths "${WORK_DIR}/disabled-agora-token-service.yaml" "$INGRESS_HOST")"
}

test_ingress() {
    log "ingress routes and hocuspocus URL"
    local out="${WORK_DIR}/ingress.yaml"
    check_render "render with ingress" "$out" --set ingress.enabled=true --set "ingress.hosts[0].host=${INGRESS_HOST}" \
        --set "ingress.hosts[0].paths[0].path=/" --set "ingress.hosts[0].paths[0].pathType=ImplementationSpecific"
    check_eq "service paths before the frontend path" \
        "${HOCUSPOCUS_PATH}:Prefix:${RELEASE}-hocuspocus ${AGORA_PATH}:Prefix:${RELEASE}-agora-token-service /:ImplementationSpecific:${RELEASE}-frontend" \
        "$(ingress_paths "$out" "$INGRESS_HOST")"
    check_eq "derived hocuspocus URL without TLS" "ws://${INGRESS_HOST}${HOCUSPOCUS_PATH}" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_URL)"

    out="${WORK_DIR}/ingress-tls.yaml"
    check_render "render with ingress and TLS" "$out" --set ingress.enabled=true --set "ingress.hosts[0].host=${INGRESS_HOST}" \
        --set "ingress.hosts[0].paths[0].path=/" --set "ingress.tls[0].hosts[0]=${INGRESS_HOST}" --set ingress.tls[0].secretName=tls
    check_eq "derived hocuspocus URL with TLS" "wss://${INGRESS_HOST}${HOCUSPOCUS_PATH}" \
        "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_URL)"

    local two_hosts=(--set ingress.enabled=true
        --set "ingress.hosts[0].host=${INGRESS_HOST}" --set "ingress.hosts[0].paths[0].path=/" --set "ingress.hosts[0].paths[0].pathType=Prefix"
        --set "ingress.hosts[1].host=${SECOND_HOST}" --set "ingress.hosts[1].paths[0].path=/" --set "ingress.hosts[1].paths[0].pathType=Prefix")
    check_render_fails "two hosts without hocuspocus.publicUrl fail" "hocuspocus.publicUrl must be set" "${two_hosts[@]}"
    out="${WORK_DIR}/ingress-two-hosts.yaml"
    check_render "two hosts with hocuspocus.publicUrl" "$out" "${two_hosts[@]}" --set hocuspocus.publicUrl="$PUBLIC_HOCUSPOCUS_URL"
    check_eq "publicUrl wins" "$PUBLIC_HOCUSPOCUS_URL" "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_HOCUSPOCUS_URL)"
    check_eq "second host gets the service paths too" \
        "${HOCUSPOCUS_PATH}:Prefix:${RELEASE}-hocuspocus ${AGORA_PATH}:Prefix:${RELEASE}-agora-token-service /:Prefix:${RELEASE}-frontend" \
        "$(ingress_paths "$out" "$SECOND_HOST")"
    check_render "two hosts, hocuspocus disabled" "${WORK_DIR}/two-hosts-off.yaml" "${two_hosts[@]}" --set hocuspocus.enabled=false
    check_render "two hosts, hocuspocus ingress route disabled" "${WORK_DIR}/two-hosts-noroute.yaml" "${two_hosts[@]}" --set hocuspocus.ingress.enabled=false
    check_render_fails "hostless rule without hocuspocus.publicUrl fails" "ingress rule without host" \
        --set ingress.enabled=true --set "ingress.hosts[0].host=" --set "ingress.hosts[0].paths[0].path=/"
}

test_redis() {
    log "redis connection"
    local out="${WORK_DIR}/release-foo.yaml"
    if helm template "$OTHER_RELEASE" "$CHART" --namespace "$NAMESPACE" > "$out" 2> "${out}.err"; then
        report "$STATUS_PASS" "render release ${OTHER_RELEASE}"
    else
        report "$STATUS_FAIL" "render release ${OTHER_RELEASE}" "$(cat "${out}.err")"
    fi
    check_eq "redis URL host is the redis Service of release ${OTHER_RELEASE}" \
        "redis://${OTHER_RELEASE}-redis-master.${NAMESPACE}.svc.cluster.local:6379" \
        "$(env_value "$out" "${OTHER_RELEASE}-lowcoder-api-service" LOWCODER_REDIS_URL)"
    check_eq "that Service exists" "${OTHER_RELEASE}-redis-master" \
        "$(field "$out" Service "${OTHER_RELEASE}-redis-master" '.metadata.name')"

    out="${WORK_DIR}/redis-host.yaml"
    check_render "external redis host:port" "$out" --set redis.enabled=false --set redis.externalUrl="$EXTERNAL_REDIS_HOST"
    check_eq "external redis host URL" "redis://${EXTERNAL_REDIS_HOST}" "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_REDIS_URL)"
    out="${WORK_DIR}/redis-host-auth.yaml"
    check_render "external redis host:port with password" "$out" --set redis.enabled=false --set redis.externalUrl="$EXTERNAL_REDIS_HOST" \
        --set redis.auth.enabled=true --set-string redis.auth.password="$SPECIAL_PASSWORD"
    check_eq "external redis host URL with encoded password" "redis://:${SPECIAL_PASSWORD_ENCODED}@${EXTERNAL_REDIS_HOST}" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_REDIS_URL)"
    out="${WORK_DIR}/redis-url.yaml"
    check_render "external redis full URL" "$out" --set redis.enabled=false --set redis.externalUrl="$EXTERNAL_REDIS_URL" \
        --set redis.auth.enabled=true --set redis.auth.password=ignored
    check_eq "full redis:// URL used as given" "$EXTERNAL_REDIS_URL" "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_REDIS_URL)"
    out="${WORK_DIR}/rediss-url.yaml"
    check_render "external rediss URL" "$out" --set redis.enabled=false --set redis.externalUrl="$EXTERNAL_REDISS_URL"
    check_eq "full rediss:// URL used as given" "$EXTERNAL_REDISS_URL" "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_REDIS_URL)"
    check_render_fails "redis auth without password fails" "set redis.auth.password or redis.auth.existingSecret" --set redis.auth.enabled=true
    check_render_fails "external redis without URL fails" "set redis.externalUrl" --set redis.enabled=false
}

test_mongodb() {
    log "mongodb connection"
    local in_chart_host="${MONGO_SERVICE}.${NAMESPACE}.svc.cluster.local"
    local out="${WORK_DIR}/mongo-in-chart.yaml"
    check_render "in-chart mongodb" "$out"
    check_eq "in-chart mongodb URL with passwords[0]" \
        "mongodb://lowcoder:supersecret@${in_chart_host}/lowcoder?retryWrites=true&ssl=false" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_MONGODB_URL)"
    out="${WORK_DIR}/mongo-in-chart-existing.yaml"
    check_render "in-chart mongodb with existingSecret" "$out" --set mongodb.auth.existingSecret=mongo-credentials
    # lookup returns nothing under helm template: an empty password shows that passwords[0] was not used
    check_eq "in-chart mongodb: existingSecret wins over passwords[0]" \
        "mongodb://lowcoder:@${in_chart_host}/lowcoder?retryWrites=true&ssl=false" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_MONGODB_URL)"

    out="${WORK_DIR}/mongo-external.yaml"
    check_render "external mongodb" "$out" --set mongodb.enabled=false --set mongodb.service.externalUrl="$EXTERNAL_MONGO_HOST"
    check_eq "external mongodb URL with passwords[0]" \
        "mongodb://lowcoder:supersecret@${EXTERNAL_MONGO_HOST}/lowcoder?retryWrites=true&ssl=false" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_MONGODB_URL)"
    out="${WORK_DIR}/mongo-special.yaml"
    check_render "external mongodb, special password" "$out" --set mongodb.enabled=false --set mongodb.service.externalUrl="$EXTERNAL_MONGO_HOST" \
        --set-string "mongodb.auth.passwords[0]=${SPECIAL_PASSWORD}"
    check_eq "mongodb password encoded" \
        "mongodb://lowcoder:${SPECIAL_PASSWORD_ENCODED}@${EXTERNAL_MONGO_HOST}/lowcoder?retryWrites=true&ssl=false" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_MONGODB_URL)"
    out="${WORK_DIR}/mongo-existing.yaml"
    check_render "external mongodb with existingSecret" "$out" --set mongodb.enabled=false --set mongodb.service.externalUrl="$EXTERNAL_MONGO_HOST" \
        --set mongodb.auth.existingSecret=mongo-credentials
    # lookup returns nothing under helm template: an empty password shows that passwords[0] was not used
    check_eq "existingSecret wins over passwords[0]" \
        "mongodb://lowcoder:@${EXTERNAL_MONGO_HOST}/lowcoder?retryWrites=true&ssl=false" \
        "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_MONGODB_URL)"
    check_render_fails "external mongodb without URL fails" "set mongodb.service.externalUrl" --set mongodb.enabled=false
}

test_false_and_zero() {
    log "false and 0 values"
    local out="${WORK_DIR}/false-zero.yaml"
    check_render "render with false/0 values" "$out" \
        --set global.config.enableEmailAuth=false --set global.config.enableUserSignUp=false \
        --set global.config.createWorkspaceOnSignup=false --set global.config.marketplacePrivateMode=false \
        --set global.mailServer.useStartTLS=false --set global.mailServer.requireStartTLS=false \
        --set global.defaults.apiRateLimit=0 --set proxyService.config.rateLimit=0
    local key
    for key in LOWCODER_EMAIL_AUTH_ENABLED LOWCODER_EMAIL_SIGNUP_ENABLED LOWCODER_CREATE_WORKSPACE_ON_SIGNUP \
               LOWCODER_MARKETPLACE_PRIVATE_MODE LOWCODER_ADMIN_SMTP_STARTTLS_ENABLED LOWCODER_ADMIN_SMTP_STARTTLS_REQUIRED; do
        check_eq "${key}=false is kept" "false" "$(env_value "$out" "${RELEASE}-api-service" "$key")"
    done
    check_eq "LOWCODER_API_RATE_LIMIT=0 is kept" "0" "$(env_value "$out" "${RELEASE}-api-service" LOWCODER_API_RATE_LIMIT)"
    check_eq "LOWCODER_PROXY_RATE_LIMIT=0 is kept" "0" "$(env_value "$out" "${RELEASE}-proxy-service" LOWCODER_PROXY_RATE_LIMIT)"
}

test_urls_and_resources() {
    log "external proxy URL and resources"
    local out="${WORK_DIR}/proxy-url.yaml"
    check_render "render with external proxy URL" "$out" --set global.config.proxyServiceUrl="http://proxy.example.com:6070/"
    check_eq "proxy URL trailing slash trimmed" "http://proxy.example.com:6070" \
        "$(env_value "$out" "${RELEASE}-frontend" LOWCODER_PROXY_SERVICE_URL)"

    out="${WORK_DIR}/resources.yaml"
    check_render "render with resources" "$out" --set resources.limits.memory=1Gi --set apiService.resources.limits.memory=2Gi
    check_eq "service resources" "2Gi" \
        "$(field "$out" Deployment "${RELEASE}-api-service" '.spec.template.spec.containers[0].resources.limits.memory')"
    check_eq "top-level resources as fallback" "1Gi" \
        "$(field "$out" Deployment "${RELEASE}-proxy-service" '.spec.template.spec.containers[0].resources.limits.memory')"
}

require_commands helm kubeconform yq

prepare_chart
test_lint_and_schema
test_new_services_default
test_secret_placement
test_disable_each_service
test_ingress
test_redis
test_mongodb
test_false_and_zero
test_urls_and_resources

print_result
