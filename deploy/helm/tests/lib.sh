#!/bin/bash

##
## Helpers shared by the tests of the Lowcoder Helm chart (render-test.sh, runtime-test.sh).
##
## Source it after setting RELEASE, NAMESPACE and CHART_SOURCE. prepare_chart sets WORK_DIR and
## CHART; the sourcing script installs its own EXIT trap and calls cleanup_work_dir from it.
## Checks are counted in PASSED / FAILED.
##

readonly STATUS_PASS="PASS"
readonly STATUS_FAIL="FAIL"

# Exit status when the test cannot run at all (missing tool, chart dependencies not buildable)
readonly EXIT_SETUP_FAILED=2

PASSED=0
FAILED=0
WORK_DIR=""
CHART=""

cleanup_work_dir() {
    [ -n "$WORK_DIR" ] && rm -rf "$WORK_DIR"
}

log() {
    echo "[$(date +%H:%M:%S)] $*"
}

# require_commands <command...> - exits with EXIT_SETUP_FAILED when one is missing
require_commands() {
    local command
    for command in "$@"; do
        if ! command -v "$command" > /dev/null; then
            echo "required command not found: ${command}"
            exit "$EXIT_SETUP_FAILED"
        fi
    done
}

# report <status> <description> [details]
report() {
    local status="$1" description="$2" details="${3:-}"
    if [ "$status" = "$STATUS_PASS" ]; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
    echo "  [${status}] ${description}"
    if [ -n "$details" ]; then
        printf '%s\n' "$details" | sed 's/^/           | /'
    fi
}

# check_eq <description> <expected> <actual>
check_eq() {
    if [ "$2" = "$3" ]; then
        report "$STATUS_PASS" "$1"
    else
        report "$STATUS_FAIL" "$1" "expected: $2"$'\n'"got:      $3"
    fi
}

# check_same <description> <value> <other value> - both equal and not empty (two absent fields are no match)
check_same() {
    if [ -z "$2" ]; then
        report "$STATUS_FAIL" "$1" "first value is empty (field absent?)"
    else
        check_eq "$1" "$2" "$3"
    fi
}

# print_result - prints the totals; returns non-zero when a check failed
print_result() {
    echo
    log "Result: ${PASSED} passed, ${FAILED} failed"
    [ "$FAILED" -eq 0 ]
}

# Copies CHART_SOURCE to a temporary CHART and builds its dependencies there
prepare_chart() {
    WORK_DIR="$(mktemp -d)"
    CHART="${WORK_DIR}/chart"
    cp -r "$CHART_SOURCE" "$CHART"
    rm -rf "${CHART}/charts" "${CHART}/Chart.lock"
    log "building chart dependencies of ${CHART_SOURCE}"
    if ! helm dependency build "$CHART" > "${WORK_DIR}/dependency.log" 2>&1; then
        cat "${WORK_DIR}/dependency.log"
        echo "helm dependency build failed"
        exit "$EXIT_SETUP_FAILED"
    fi
}

# render <output file> [helm template args...] - prints helm errors, returns helm's status
render() {
    local out="$1"
    shift
    helm template "$RELEASE" "$CHART" --namespace "$NAMESPACE" "$@" > "$out" 2> "${out}.err"
    local rc=$?
    [ $rc -ne 0 ] && sed 's/^/    helm: /' "${out}.err"
    return $rc
}

# check_render <description> <output file> [helm args...]
check_render() {
    local description="$1" out="$2"
    shift 2
    if render "$out" "$@"; then
        report "$STATUS_PASS" "$description"
    else
        report "$STATUS_FAIL" "$description" "helm template failed: $(cat "${out}.err")"
    fi
}

# check_render_fails <description> <expected error substring> [helm args...]
check_render_fails() {
    local description="$1" expected="$2"
    shift 2
    local out="${WORK_DIR}/expect-fail.yaml"
    if helm template "$RELEASE" "$CHART" --namespace "$NAMESPACE" "$@" > "$out" 2> "${out}.err"; then
        report "$STATUS_FAIL" "$description" "render succeeded, expected an error containing: ${expected}"
    elif grep -qF -- "$expected" "${out}.err"; then
        report "$STATUS_PASS" "$description"
    else
        report "$STATUS_FAIL" "$description" "expected error: ${expected}"$'\n'"got: $(cat "${out}.err")"
    fi
}

# field <file> <kind> <name> <yq path> - value of a field of one rendered object ("" when absent)
field() {
    yq -N "select(.kind == \"$2\" and .metadata.name == \"$3\") | ($4 // \"\")" "$1" 2>/dev/null | sed '/^$/d'
}

# env_value <file> <name of ConfigMap/Secret> <key> - value from data or stringData
env_value() {
    yq -N "select((.kind == \"ConfigMap\" or .kind == \"Secret\") and .metadata.name == \"$2\") | (.data.\"$3\" // .stringData.\"$3\" // \"\")" "$1" 2>/dev/null | sed '/^$/d'
}

# ingress_paths <file> <host> - "path:pathType:service" entries of a host in order
ingress_paths() {
    yq -N "select(.kind == \"Ingress\") | .spec.rules[] | select(.host == \"$2\") | .http.paths[] | .path + \":\" + .pathType + \":\" + .backend.service.name" "$1" 2>/dev/null | sed '/^$/d' | tr '\n' ' ' | sed 's/ $//'
}
