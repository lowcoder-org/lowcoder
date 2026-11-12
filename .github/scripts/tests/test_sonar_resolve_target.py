import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sonar_resolve_target as rt  # noqa: E402

REPO = "lowcoder-org/lowcoder"
SHA = "a" * 40
OTHER_SHA = "b" * 40
PR = "2201"
FORK = "someone/lowcoder"


def base_env(**overrides):
    env = {
        "REPO": REPO,
        "DEFAULT_BRANCH": "main",
        "RUN_EVENT": "pull_request",
        "RUN_HEAD_SHA": SHA,
        "RUN_HEAD_BRANCH": "feature",
        "RUN_HEAD_REPO": FORK,
    }
    env.update(overrides)
    return env


def pr_meta(**overrides):
    meta = {"event": "pull_request", "pr_number": PR, "head_sha": SHA}
    meta.update(overrides)
    return meta


def api_pr(**overrides):
    payload = {
        "state": "open",
        "head": {"sha": SHA, "ref": "feature/x", "repo": {"full_name": FORK}},
        "base": {"ref": "dev", "repo": {"full_name": REPO}},
    }
    payload.update(overrides)
    return payload


def stub(payload):
    calls = []

    def fetch(repo, number):
        calls.append((repo, number))
        return payload

    fetch.calls = calls
    return fetch


class ResolvePullRequestTest(unittest.TestCase):
    def test_happy_path_builds_scanner_args_from_api_values(self):
        fetch = stub(api_pr())
        out = rt.resolve(base_env(), pr_meta(), fetch)
        self.assertEqual(out["mode"], rt.MODE_PR)
        self.assertEqual(out["pr_number"], PR)
        self.assertEqual(fetch.calls, [(REPO, PR)])
        self.assertEqual(
            out["scanner_args"],
            f"-Dsonar.scm.revision={SHA} -Dsonar.pullrequest.key={PR} "
            "-Dsonar.pullrequest.branch=feature/x -Dsonar.pullrequest.base=dev",
        )

    def test_metadata_branch_names_are_ignored(self):
        meta = pr_meta(head_ref="evil -Dsonar.host.url=https://x", base_ref="$(id)")
        out = rt.resolve(base_env(), meta, stub(api_pr()))
        self.assertNotIn("evil", out["scanner_args"])
        self.assertNotIn("$(id)", out["scanner_args"])

    def test_metadata_sha_mismatch(self):
        with self.assertRaises(rt.MetadataError):
            rt.resolve(base_env(), pr_meta(head_sha=OTHER_SHA), stub(api_pr()))

    def test_metadata_event_mismatch(self):
        with self.assertRaises(rt.MetadataError):
            rt.resolve(base_env(), pr_meta(event="push"), stub(api_pr()))

    def test_api_head_sha_mismatch(self):
        payload = api_pr(head={"sha": OTHER_SHA, "ref": "f", "repo": {"full_name": FORK}})
        with self.assertRaises(rt.PullRequestMismatchError):
            rt.resolve(base_env(), pr_meta(), stub(payload))

    def test_head_repo_mismatch(self):
        payload = api_pr(head={"sha": SHA, "ref": "f", "repo": {"full_name": "other/repo"}})
        with self.assertRaises(rt.PullRequestMismatchError):
            rt.resolve(base_env(), pr_meta(), stub(payload))

    def test_null_head_repo_fails(self):
        payload = api_pr(head={"sha": SHA, "ref": "f", "repo": None})
        with self.assertRaises(rt.PullRequestMismatchError):
            rt.resolve(base_env(), pr_meta(), stub(payload))

    def test_base_repo_mismatch(self):
        payload = api_pr(base={"ref": "dev", "repo": {"full_name": "other/repo"}})
        with self.assertRaises(rt.PullRequestMismatchError):
            rt.resolve(base_env(), pr_meta(), stub(payload))

    def test_closed_pr(self):
        with self.assertRaises(rt.PullRequestMismatchError):
            rt.resolve(base_env(), pr_meta(), stub(api_pr(state="closed")))

    def test_bad_pr_numbers(self):
        for bad in ["12a", "0", "-1", "1 2", "12345678901", "", None, 12, "12\n", "12\r\n"]:
            with self.subTest(pr_number=bad):
                with self.assertRaises(rt.InvalidValueError):
                    rt.resolve(base_env(), pr_meta(pr_number=bad), stub(api_pr()))

    def test_bad_refs_from_api(self):
        for bad in ["a b", "a$b", "a`b", "a\nb", "feature\n", "-leading", ""]:
            with self.subTest(ref=bad):
                payload = api_pr(head={"sha": SHA, "ref": bad, "repo": {"full_name": FORK}})
                with self.assertRaises(rt.InvalidValueError):
                    rt.resolve(base_env(), pr_meta(), stub(payload))

    def test_bad_run_sha(self):
        for bad in ["", "A" * 40, "a" * 39, "g" * 40, "a" * 40 + "\n"]:
            with self.subTest(sha=bad):
                with self.assertRaises(rt.InvalidValueError):
                    rt.resolve(base_env(RUN_HEAD_SHA=bad), pr_meta(), stub(api_pr()))


class ResolvePushTest(unittest.TestCase):
    def env(self, **overrides):
        values = {"RUN_EVENT": "push", "RUN_HEAD_BRANCH": "main", "RUN_HEAD_REPO": REPO}
        values.update(overrides)
        return base_env(**values)

    def meta(self):
        return {"event": "push", "pr_number": "", "head_sha": SHA}

    def test_push_on_default_branch(self):
        fetch = stub({})
        out = rt.resolve(self.env(), self.meta(), fetch)
        self.assertEqual(out["mode"], rt.MODE_PUSH)
        self.assertEqual(out["scanner_args"], f"-Dsonar.scm.revision={SHA} -Dsonar.branch.name=main")
        self.assertEqual(fetch.calls, [])

    def test_push_from_other_branch(self):
        with self.assertRaises(rt.UnsupportedEventError):
            rt.resolve(self.env(RUN_HEAD_BRANCH="feature"), self.meta(), stub({}))

    def test_push_from_other_repo(self):
        with self.assertRaises(rt.UnsupportedEventError):
            rt.resolve(self.env(RUN_HEAD_REPO=FORK), self.meta(), stub({}))

    def test_other_event(self):
        with self.assertRaises(rt.UnsupportedEventError):
            rt.resolve(base_env(RUN_EVENT="schedule"), {"event": "schedule", "head_sha": SHA}, stub({}))


class MetadataAndOutputTest(unittest.TestCase):
    def write(self, text):
        handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
        handle.write(text)
        handle.close()
        self.addCleanup(os.unlink, handle.name)
        return handle.name

    def test_valid(self):
        self.assertEqual(rt.load_metadata(self.write('{"a": 1}')), {"a": 1})

    def test_oversized(self):
        path = self.write(json.dumps({"x": "y" * (rt.MAX_METADATA_BYTES + 1)}))
        with self.assertRaises(rt.MetadataError):
            rt.load_metadata(path)

    def test_not_an_object(self):
        with self.assertRaises(rt.MetadataError):
            rt.load_metadata(self.write("[1, 2]"))

    def test_not_json(self):
        with self.assertRaises(rt.MetadataError):
            rt.load_metadata(self.write("{nope"))

    def test_missing_file(self):
        with self.assertRaises(rt.MetadataError):
            rt.load_metadata("/nonexistent/metadata.json")

    def test_format_outputs_rejects_newline_injection(self):
        with self.assertRaises(rt.InvalidValueError):
            rt.format_outputs({"scanner_args": "a\nmode=evil"})

    def test_format_outputs(self):
        self.assertEqual(rt.format_outputs({"mode": "pr", "pr_number": "5"}), "mode=pr\npr_number=5\n")

    def test_fetch_pr_validates_inputs_before_running_gh(self):
        with self.assertRaises(rt.InvalidValueError):
            rt.fetch_pr("bad repo", "5")
        with self.assertRaises(rt.InvalidValueError):
            rt.fetch_pr(REPO + "\n", "5")
        with self.assertRaises(rt.InvalidValueError):
            rt.fetch_pr(REPO, "5\n")
        with self.assertRaises(rt.InvalidValueError):
            rt.fetch_pr(REPO, "5; id")


if __name__ == "__main__":
    unittest.main(verbosity=2)
