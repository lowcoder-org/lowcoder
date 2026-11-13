#!/usr/bin/env python3
"""Validate and place the compiled-class tarball from the untrusted build job.

Runs in the secret-bearing scan job. The archive is attacker-controlled for pull
requests, so it is checked member by member before anything is written to the
workspace. The allowlist is the `sonar.java.binaries` list of the TRUSTED copy of
sonar-project.properties, so there is no second list to drift.

Every CLI path is canonicalised and confined before use: --properties, --archive and
--staging must resolve inside $RUNNER_TEMP, --workspace inside $GITHUB_WORKSPACE.

Limits: this guarantees that only regular files and directories under the allowed
`target/` dirs are placed. It says nothing about whether the class files themselves
are benign; the scanner parses them as data. The path confinement is a guard on the
arguments only; it does not make the archive contents trustworthy.
"""

import argparse
import os
import re
import stat
import sys
import tarfile
from typing import List, Sequence

BINARIES_KEY = "sonar.java.binaries"
ALLOWED_DIR_RE = re.compile(r"^server/api-service/[A-Za-z0-9._/-]+/target$")
MAX_MEMBERS = 200_000
MAX_TOTAL_BYTES = 3 * 1024 ** 3
MIN_PYTHON = (3, 12)
ENV_TEMP_ROOT = "RUNNER_TEMP"
ENV_WORKSPACE_ROOT = "GITHUB_WORKSPACE"

EXIT_OK = 0
EXIT_FAILURE = 1


class ExtractError(Exception):
    """Base class for every refusal made by this script."""


class PropertiesError(ExtractError):
    """sonar-project.properties is missing the binaries list or it is malformed."""


class ArchiveError(ExtractError):
    """The archive is malformed, exceeds limits, or lacks an expected directory."""


class MemberError(ExtractError):
    """A tar member has a forbidden type or name."""


class PlacementError(ExtractError):
    """The workspace cannot safely receive the extracted directories."""


class PathConfinementError(ExtractError):
    """A CLI path resolves outside the directory it must stay inside."""


def confine_path(path: str, root: str, what: str) -> str:
    """Canonicalise `path` and require it to be `root` or inside it.

    Order matters: normalise with realpath (resolves `..` and symlinks), then compare
    against the realpath of the root with a trailing separator, so `/base-evil` does
    not pass for `/base`. The same helper is duplicated in sonar_resolve_target.py,
    because these scripts run with `python3 -I` and cannot import each other.
    """
    if not root:
        raise PathConfinementError(f"no trusted root directory for {what}")
    base = os.path.realpath(root)
    resolved = os.path.realpath(path)
    if resolved != base and not resolved.startswith(base + os.sep):
        raise PathConfinementError(f"{what} {path!r} resolves outside {base}")
    return resolved


def parse_allowed_dirs(properties_path: str) -> List[str]:
    """Return the validated `sonar.java.binaries` entries from the properties file."""
    try:
        with open(properties_path, "r", encoding="utf-8") as handle:
            lines = handle.read().splitlines()
    except OSError as exc:
        raise PropertiesError(f"cannot read {properties_path}: {exc}") from exc
    value = None
    for line in lines:
        if line.startswith(BINARIES_KEY + "="):
            value = line[len(BINARIES_KEY) + 1:]
    if not value:
        raise PropertiesError(f"{BINARIES_KEY} not found or empty")
    entries = [item.strip() for item in value.split(",")]
    for entry in entries:
        segments = entry.split("/")
        if not ALLOWED_DIR_RE.fullmatch(entry) or any(s in ("", ".", "..") for s in segments):
            raise PropertiesError(f"disallowed {BINARIES_KEY} entry: {entry!r}")
    if len(set(entries)) != len(entries):
        raise PropertiesError(f"duplicate {BINARIES_KEY} entries")
    return entries


def check_member(member: tarfile.TarInfo, allowed: Sequence[str]) -> None:
    """Raise MemberError unless the member is a regular file/dir inside an allowed dir."""
    name = member.name
    if not (member.isreg() or member.isdir()):
        raise MemberError(f"forbidden member type for {name!r}")
    if "\x00" in name or "\\" in name or name.startswith("/"):
        raise MemberError(f"forbidden member name {name!r}")
    if any(segment in ("", ".", "..") for segment in name.split("/")):
        raise MemberError(f"forbidden path segment in {name!r}")
    if not any(name == d or name.startswith(d + "/") for d in allowed):
        raise MemberError(f"member outside the allowlist: {name!r}")


def validate_archive(
    archive: tarfile.TarFile,
    allowed: Sequence[str],
    max_members: int = MAX_MEMBERS,
    max_total_bytes: int = MAX_TOTAL_BYTES,
) -> List[tarfile.TarInfo]:
    """Validate every member and the limits; return the member list."""
    members: List[tarfile.TarInfo] = []
    total = 0
    for member in archive:
        if len(members) >= max_members:
            raise ArchiveError(f"more than {max_members} members")
        check_member(member, allowed)
        total += member.size
        if total > max_total_bytes:
            raise ArchiveError(f"archive content exceeds {max_total_bytes} bytes")
        members.append(member)
    return members


def _is_real_dir(path: str) -> bool:
    try:
        return stat.S_ISDIR(os.lstat(path).st_mode)
    except OSError:
        return False


def _check_real_ancestors(workspace: str, relative_dir: str) -> str:
    """Return the parent dir of relative_dir; every ancestor must already be a real dir."""
    current = workspace
    for segment in relative_dir.split("/")[:-1]:
        current = os.path.join(current, segment)
        if not _is_real_dir(current):
            raise PlacementError(f"workspace ancestor is missing or not a real directory: {current}")
    return current


def place(staging: str, workspace: str, allowed: Sequence[str]) -> None:
    """Check every source and destination first, then rename each staged dir into place.

    All checks run before the first move, so an unsafe later destination cannot leave
    earlier directories already placed. os.rename (not a copy) keeps the guarantee that
    only the validated staged tree lands in the workspace; it fails if staging and the
    workspace are on different filesystems.
    """
    moves = []
    for relative_dir in allowed:
        source = os.path.join(staging, relative_dir)
        if not _is_real_dir(source):
            raise ArchiveError(f"allowed directory missing from archive: {relative_dir}")
        parent = _check_real_ancestors(workspace, relative_dir)
        destination = os.path.join(parent, os.path.basename(relative_dir))
        if os.path.lexists(destination):
            raise PlacementError(f"destination already exists: {destination}")
        moves.append((source, destination))
    for source, destination in moves:
        try:
            os.rename(source, destination)
        except OSError as exc:
            raise PlacementError(f"cannot move {source} to {destination}: {exc}") from exc


def extract_and_place(
    properties: str,
    archive_path: str,
    staging: str,
    workspace: str,
    max_members: int = MAX_MEMBERS,
    max_total_bytes: int = MAX_TOTAL_BYTES,
) -> None:
    if sys.version_info < MIN_PYTHON:
        raise ExtractError(f"Python {MIN_PYTHON[0]}.{MIN_PYTHON[1]}+ required")
    allowed = parse_allowed_dirs(properties)
    if os.path.lexists(staging):
        raise PlacementError(f"staging directory already exists: {staging}")
    try:
        with tarfile.open(archive_path, mode="r:") as archive:
            members = validate_archive(archive, allowed, max_members, max_total_bytes)
            os.mkdir(staging)
            archive.extractall(staging, members=members, filter="data")
    except tarfile.TarError as exc:
        raise ArchiveError(f"cannot read archive {archive_path}: {exc}") from exc
    except OSError as exc:
        raise ArchiveError(f"cannot open archive {archive_path}: {exc}") from exc
    place(staging, workspace, allowed)


def main(argv=None, env=None) -> int:
    env = os.environ if env is None else env
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--properties", required=True, help="TRUSTED sonar-project.properties")
    parser.add_argument("--archive", required=True)
    parser.add_argument("--staging", required=True, help="fresh directory, must not exist")
    parser.add_argument("--workspace", required=True)
    args = parser.parse_args(argv)
    try:
        temp_root = env.get(ENV_TEMP_ROOT, "")
        workspace_root = env.get(ENV_WORKSPACE_ROOT, "")
        extract_and_place(
            confine_path(args.properties, temp_root, "--properties"),
            confine_path(args.archive, temp_root, "--archive"),
            confine_path(args.staging, temp_root, "--staging"),
            confine_path(args.workspace, workspace_root, "--workspace"),
        )
    except ExtractError as exc:
        print(f"sonar_artifact_extract: {type(exc).__name__}: {exc}", file=sys.stderr)
        return EXIT_FAILURE
    print("placed compiled classes into the workspace")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
