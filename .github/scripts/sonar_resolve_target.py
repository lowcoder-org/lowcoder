#!/usr/bin/env python3
"""Resolve and validate the analysis target for the trusted SonarCloud scan job.

Runs in the secret-bearing `workflow_run` job (see .github/workflows/sonarcloud.yml).
Everything read from the build artifact is attacker-controlled for pull requests, so
every value is validated here before it can reach `GITHUB_OUTPUT` or the scanner
`args`. Only the PR number is taken from the artifact; branch names and the head
repository come from the GitHub API.

The --metadata path is canonicalised and must resolve inside $RUNNER_TEMP.

Limits: this script binds a PR number to a head SHA and a head repository. It does
not make the *contents* of the commit trustworthy; the scanner still parses them.

Output (stdout, `key=value` lines for `$GITHUB_OUTPUT`): mode, pr_number, head_sha,
scanner_args. Exit code is non-zero with a specific message on any failure.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from typing import Callable, Dict, Mapping

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
PR_RE = re.compile(r"^[1-9][0-9]{0,9}$")
REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$")
REPO_RE = re.compile(r"^[A-Za-z0-9._-]{1,100}/[A-Za-z0-9._-]{1,100}$")

MAX_METADATA_BYTES = 4096
API_TIMEOUT_SECONDS = 60
ENV_TEMP_ROOT = "RUNNER_TEMP"

EVENT_PULL_REQUEST = "pull_request"
EVENT_PUSH = "push"
MODE_PR = "pr"
MODE_PUSH = "push"
PR_STATE_OPEN = "open"

EXIT_OK = 0
EXIT_FAILURE = 1


class ResolveError(Exception):
    """Base class: the analysis target could not be resolved safely."""


class InvalidValueError(ResolveError):
    """A value failed its format check (SHA, PR number, ref, repo)."""


class MetadataError(ResolveError):
    """The artifact metadata is missing, oversized, malformed or inconsistent."""


class PullRequestMismatchError(ResolveError):
    """The API shows the PR is not the one the workflow run claims to be for."""


class UnsupportedEventError(ResolveError):
    """The triggering event or branch is not one this workflow analyses."""


class ApiError(ResolveError):
    """The GitHub API call failed or returned an unusable payload."""


class PathConfinementError(ResolveError):
    """A CLI path resolves outside the directory it must stay inside."""


def confine_path(path: str, root: str, what: str) -> str:
    """Canonicalise `path` and require it to be `root` or inside it.

    Order matters: normalise with realpath (resolves `..` and symlinks), then compare
    against the realpath of the root with a trailing separator, so `/base-evil` does
    not pass for `/base`. The same helper is duplicated in sonar_artifact_extract.py,
    because these scripts run with `python3 -I` and cannot import each other.
    """
    if not root:
        raise PathConfinementError(f"no trusted root directory for {what}")
    base = os.path.realpath(root)
    resolved = os.path.realpath(path)
    if resolved != base and not resolved.startswith(base + os.sep):
        raise PathConfinementError(f"{what} {path!r} resolves outside {base}")
    return resolved


def _require(value: str, pattern: "re.Pattern[str]", what: str) -> str:
    # fullmatch, not match: `$` would also accept a trailing newline.
    if not isinstance(value, str) or not pattern.fullmatch(value):
        raise InvalidValueError(f"invalid {what}: {value!r}")
    return value


def load_metadata(path: str) -> Mapping[str, object]:
    """Read the artifact metadata; it is size-limited and must be a JSON object."""
    try:
        size = os.path.getsize(path)
    except OSError as exc:
        raise MetadataError(f"cannot stat metadata {path}: {exc}") from exc
    if size > MAX_METADATA_BYTES:
        raise MetadataError(f"metadata is {size} bytes, limit is {MAX_METADATA_BYTES}")
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError) as exc:
        raise MetadataError(f"cannot parse metadata {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise MetadataError("metadata is not a JSON object")
    return data


def fetch_pr(repo: str, number: str) -> Mapping[str, object]:
    """Fetch one pull request via `gh api` (the single function tests stub)."""
    _require(repo, REPO_RE, "repository")
    _require(number, PR_RE, "PR number")
    try:
        proc = subprocess.run(
            ["gh", "api", f"repos/{repo}/pulls/{number}"],
            capture_output=True,
            text=True,
            check=False,
            timeout=API_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ApiError(f"gh api failed to run: {exc}") from exc
    if proc.returncode != 0:
        raise ApiError(f"gh api exited {proc.returncode}: {proc.stderr.strip()}")
    try:
        payload = json.loads(proc.stdout)
    except ValueError as exc:
        raise ApiError(f"gh api returned non-JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise ApiError("gh api returned a non-object payload")
    return payload


def _dig(payload: Mapping[str, object], *keys: str) -> object:
    node: object = payload
    for key in keys:
        if not isinstance(node, dict):
            return None
        node = node.get(key)
    return node


def resolve(
    env: Mapping[str, str],
    metadata: Mapping[str, object],
    fetch: Callable[[str, str], Mapping[str, object]] = fetch_pr,
) -> Dict[str, str]:
    """Validate the workflow_run context and artifact metadata; return outputs."""
    repo = _require(env.get("REPO", ""), REPO_RE, "REPO")
    default_branch = _require(env.get("DEFAULT_BRANCH", ""), REF_RE, "DEFAULT_BRANCH")
    run_event = env.get("RUN_EVENT", "")
    run_sha = _require(env.get("RUN_HEAD_SHA", ""), SHA_RE, "RUN_HEAD_SHA")
    run_head_repo = env.get("RUN_HEAD_REPO", "")

    if metadata.get("head_sha") != run_sha:
        raise MetadataError("metadata head_sha does not match the workflow run head SHA")
    if metadata.get("event") != run_event:
        raise MetadataError("metadata event does not match the workflow run event")

    if run_event == EVENT_PULL_REQUEST:
        number = metadata.get("pr_number")
        _require(number, PR_RE, "pr_number")  # type: ignore[arg-type]
        pr = fetch(repo, str(number))
        if _dig(pr, "state") != PR_STATE_OPEN:
            raise PullRequestMismatchError(f"PR {number} is not open")
        if _dig(pr, "head", "sha") != run_sha:
            raise PullRequestMismatchError(f"PR {number} head SHA differs from the run head SHA")
        api_head_repo = _dig(pr, "head", "repo", "full_name")
        if api_head_repo is None or api_head_repo != run_head_repo:
            raise PullRequestMismatchError(f"PR {number} head repository differs from the run")
        if _dig(pr, "base", "repo", "full_name") != repo:
            raise PullRequestMismatchError(f"PR {number} does not target {repo}")
        head_ref = _require(_dig(pr, "head", "ref"), REF_RE, "PR head ref")  # type: ignore[arg-type]
        base_ref = _require(_dig(pr, "base", "ref"), REF_RE, "PR base ref")  # type: ignore[arg-type]
        scanner_args = " ".join(
            [
                f"-Dsonar.scm.revision={run_sha}",
                f"-Dsonar.pullrequest.key={number}",
                f"-Dsonar.pullrequest.branch={head_ref}",
                f"-Dsonar.pullrequest.base={base_ref}",
            ]
        )
        return {"mode": MODE_PR, "pr_number": str(number), "head_sha": run_sha, "scanner_args": scanner_args}

    if run_event == EVENT_PUSH:
        if env.get("RUN_HEAD_BRANCH") != default_branch:
            raise UnsupportedEventError("push run is not on the default branch")
        if run_head_repo != repo:
            raise UnsupportedEventError("push run is not from this repository")
        scanner_args = f"-Dsonar.scm.revision={run_sha} -Dsonar.branch.name={default_branch}"
        return {"mode": MODE_PUSH, "pr_number": "", "head_sha": run_sha, "scanner_args": scanner_args}

    raise UnsupportedEventError(f"unsupported event: {run_event!r}")


def format_outputs(outputs: Mapping[str, str]) -> str:
    """Render `key=value` lines; refuses any value that could inject extra lines."""
    lines = []
    for key, value in outputs.items():
        if "\n" in value or "\r" in value:
            raise InvalidValueError(f"output {key} contains a newline")
        lines.append(f"{key}={value}")
    return "\n".join(lines) + "\n"


def main(argv=None, env=None) -> int:
    env = os.environ if env is None else env
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--metadata", required=True, help="path to the artifact metadata.json")
    args = parser.parse_args(argv)
    try:
        metadata_path = confine_path(args.metadata, env.get(ENV_TEMP_ROOT, ""), "--metadata")
        outputs = resolve(env, load_metadata(metadata_path))
        sys.stdout.write(format_outputs(outputs))
    except ResolveError as exc:
        print(f"sonar_resolve_target: {type(exc).__name__}: {exc}", file=sys.stderr)
        return EXIT_FAILURE
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
