#!/usr/bin/env bash
# Check out the analysed commit as DATA in the trusted scan job.
#
# Inputs (env): MODE (pr|push), PR_NUMBER, HEAD_SHA, DEFAULT_BRANCH.
# Runs in a checkout of the trusted default branch. The .git directory and its config are
# never taken from the artifact or from PR content, so PR content cannot add git config
# (fsmonitor, hooks, ...) that would execute. Nothing from the checked-out tree is executed.
#
# Limits: needs the repository to be fetchable without credentials (public repo, the
# trusted checkout uses persist-credentials: false). Does not validate file contents.
set -euo pipefail

readonly MODE_PR="pr"
readonly MODE_PUSH="push"
readonly PR_RE='^[1-9][0-9]{0,9}$'
readonly SHA_RE='^[0-9a-f]{40}$'
readonly BRANCH_RE='^[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$'
readonly SYMLINK_MODE="120000"
readonly PR_HEAD_REF="refs/sonar/pr-head"

fail() { echo "sonar_checkout_target: $*" >&2; exit 1; }

: "${MODE:?MODE is required}"
: "${HEAD_SHA:?HEAD_SHA is required}"
[[ $HEAD_SHA =~ $SHA_RE ]] || fail "HEAD_SHA is not a 40-char hex SHA"

case "$MODE" in
  "$MODE_PR")
    : "${PR_NUMBER:?PR_NUMBER is required in pr mode}"
    [[ $PR_NUMBER =~ $PR_RE ]] || fail "PR_NUMBER is not a plain integer"
    git fetch --no-tags --no-recurse-submodules origin "+refs/pull/${PR_NUMBER}/head:${PR_HEAD_REF}"
    fetched="$(git rev-parse "${PR_HEAD_REF}^{commit}")"
    # The PR may have moved after the API check; fail closed, the next run covers the new SHA.
    [[ $fetched == "$HEAD_SHA" ]] || fail "fetched PR head $fetched differs from expected $HEAD_SHA"
    ;;
  "$MODE_PUSH")
    : "${DEFAULT_BRANCH:?DEFAULT_BRANCH is required in push mode}"
    [[ $DEFAULT_BRANCH =~ $BRANCH_RE ]] || fail "DEFAULT_BRANCH has an invalid format"
    git merge-base --is-ancestor "$HEAD_SHA" "origin/${DEFAULT_BRANCH}" \
      || fail "$HEAD_SHA is not an ancestor of origin/${DEFAULT_BRANCH}"
    ;;
  *) fail "unknown MODE: $MODE" ;;
esac

GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null checkout --detach --force "$HEAD_SHA"

# Tracked symlinks (e.g. node_modules/.bin/*) can point anywhere, including at
# /proc/self/environ, which the scanner would upload as "source". Remove every one.
removed=0
while IFS= read -r -d '' record; do
  mode="${record%% *}"
  path="${record#*$'\t'}"
  if [[ $mode == "$SYMLINK_MODE" ]]; then
    rm -f -- "$path"
    removed=$((removed + 1))
  fi
done < <(git ls-files -s -z)
echo "removed $removed tracked symlinks"

leftover="$(find . -path ./.git -prune -o -type l -print)"
[[ -z $leftover ]] || fail "symlinks remain after cleanup: $leftover"

echo "checked out $HEAD_SHA (mode $MODE)"
