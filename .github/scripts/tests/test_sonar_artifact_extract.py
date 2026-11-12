import io
import os
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sonar_artifact_extract as ex  # noqa: E402

DIR_A = "server/api-service/lowcoder-domain/target"
DIR_B = "server/api-service/lowcoder-plugins/mongoPlugin/target"
ALLOWED = [DIR_A, DIR_B]


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.tmp = Path(self._tmp.name)
        self.props = self.tmp / "sonar-project.properties"
        self.props.write_text(
            "sonar.projectKey=x\nsonar.java.binaries=" + ",".join(ALLOWED) + "\n", encoding="utf-8"
        )
        self.workspace = self.tmp / "ws"
        for d in ALLOWED:
            (self.workspace / Path(d).parent).mkdir(parents=True)
        self.staging = self.tmp / "staging"
        self.archive = self.tmp / "a.tar"

    def build_tar(self, entries):
        """entries: list of (name, kind, payload); kind in file|dir|sym|hard|fifo|chr."""
        with tarfile.open(self.archive, "w:") as tf:
            for name, kind, payload in entries:
                info = tarfile.TarInfo(name)
                if kind == "file":
                    data = payload if payload is not None else b"x"
                    info.size = len(data)
                    tf.addfile(info, io.BytesIO(data))
                elif kind == "dir":
                    info.type = tarfile.DIRTYPE
                    info.mode = 0o755
                    tf.addfile(info)
                elif kind == "sym":
                    info.type = tarfile.SYMTYPE
                    info.linkname = payload
                    tf.addfile(info)
                elif kind == "hard":
                    info.type = tarfile.LNKTYPE
                    info.linkname = payload
                    tf.addfile(info)
                elif kind == "fifo":
                    info.type = tarfile.FIFOTYPE
                    tf.addfile(info)
                elif kind == "chr":
                    info.type = tarfile.CHRTYPE
                    tf.addfile(info)

    def good_entries(self):
        entries = []
        for d in ALLOWED:
            entries.append((d, "dir", None))
            entries.append((f"{d}/classes/A.class", "file", b"\xca\xfe"))
        return entries

    def run_extract(self, **kwargs):
        return ex.extract_and_place(
            str(self.props), str(self.archive), str(self.staging), str(self.workspace), **kwargs
        )


class PropertiesTest(Base):
    def write_props(self, text):
        self.props.write_text(text, encoding="utf-8")

    def test_parse_ok(self):
        self.assertEqual(ex.parse_allowed_dirs(str(self.props)), ALLOWED)

    def test_missing_key(self):
        self.write_props("sonar.projectKey=x\n")
        with self.assertRaises(ex.PropertiesError):
            ex.parse_allowed_dirs(str(self.props))

    def test_malformed_entries(self):
        for bad in [
            "../etc/target",
            "server/api-service/../../etc/target",
            "server/api-service/a/target,",
            "/abs/target",
            "server/api-service/a/b",
            "server/api-service//a/target",
            f"{DIR_A},{DIR_A}",
        ]:
            with self.subTest(entry=bad):
                self.write_props(f"sonar.java.binaries={bad}\n")
                with self.assertRaises(ex.PropertiesError):
                    ex.parse_allowed_dirs(str(self.props))

    def test_allowed_dir_regex_rejects_trailing_newline(self):
        self.assertIsNotNone(ex.ALLOWED_DIR_RE.fullmatch(DIR_A))
        self.assertIsNone(ex.ALLOWED_DIR_RE.fullmatch(DIR_A + "\n"))

    def test_unreadable_file(self):
        with self.assertRaises(ex.PropertiesError):
            ex.parse_allowed_dirs(str(self.tmp / "missing.properties"))

    def test_real_repo_properties_parse(self):
        repo_props = Path(__file__).resolve().parents[3] / "sonar-project.properties"
        dirs = ex.parse_allowed_dirs(str(repo_props))
        self.assertGreater(len(dirs), 0)


class ExtractTest(Base):
    def test_happy_path_places_dirs(self):
        self.build_tar(self.good_entries())
        self.run_extract()
        for d in ALLOWED:
            self.assertTrue((self.workspace / d / "classes" / "A.class").is_file(), d)

    def test_rejects_parent_traversal(self):
        self.build_tar(self.good_entries() + [(f"{DIR_A}/../../../../.git/config", "file", b"x")])
        with self.assertRaises(ex.MemberError):
            self.run_extract()
        self.assertFalse(self.staging.exists())

    def test_rejects_target_dotdot_src(self):
        self.build_tar(self.good_entries() + [(f"{DIR_A}/../src/Evil.java", "file", b"x")])
        with self.assertRaises(ex.MemberError):
            self.run_extract()

    def test_rejects_absolute_member(self):
        self.build_tar(self.good_entries() + [("/tmp/x", "file", b"x")])
        with self.assertRaises(ex.MemberError):
            self.run_extract()

    def test_rejects_special_member_types(self):
        for kind, payload in [("sym", "/etc"), ("hard", f"{DIR_A}/classes/A.class"), ("fifo", None), ("chr", None)]:
            with self.subTest(kind=kind):
                self.build_tar(self.good_entries() + [(f"{DIR_A}/classes/L", kind, payload)])
                with self.assertRaises(ex.MemberError):
                    self.run_extract()
                self.assertFalse(self.staging.exists())

    def test_rejects_member_outside_allowlist(self):
        for name in ["server/api-service/lowcoder-server/src/A.java", ".git/config", f"{DIR_A}x/A.class"]:
            with self.subTest(name=name):
                self.build_tar(self.good_entries() + [(name, "file", b"x")])
                with self.assertRaises(ex.MemberError):
                    self.run_extract()

    def test_rejects_backslash_and_empty_segments(self):
        for name in [f"{DIR_A}\\x", f"{DIR_A}//x", f"{DIR_A}/./x"]:
            with self.subTest(name=name):
                self.build_tar(self.good_entries() + [(name, "file", b"x")])
                with self.assertRaises(ex.MemberError):
                    self.run_extract()

    def test_missing_allowed_dir(self):
        self.build_tar([(DIR_A, "dir", None), (f"{DIR_A}/classes/A.class", "file", b"x")])
        with self.assertRaises(ex.ArchiveError):
            self.run_extract()
        self.assertFalse((self.workspace / DIR_A).exists())

    def test_workspace_ancestor_is_symlink(self):
        elsewhere = self.tmp / "elsewhere"
        elsewhere.mkdir()
        module = self.workspace / Path(DIR_A).parent
        module.rmdir()
        os.symlink(elsewhere, module)
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()
        self.assertEqual(list(elsewhere.iterdir()), [])

    def test_missing_workspace_ancestor_is_rejected_not_created(self):
        module = self.workspace / Path(DIR_B).parent
        module.rmdir()
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()
        self.assertFalse(module.exists())

    def test_unsafe_later_destination_leaves_nothing_placed(self):
        # DIR_A is safe, DIR_B's module dir is a symlink: nothing may be moved, not even DIR_A.
        elsewhere = self.tmp / "elsewhere"
        elsewhere.mkdir()
        module = self.workspace / Path(DIR_B).parent
        module.rmdir()
        os.symlink(elsewhere, module)
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()
        self.assertFalse((self.workspace / DIR_A).exists())
        self.assertEqual(list(elsewhere.iterdir()), [])

    def test_rename_failure_is_a_placement_error(self):
        self.build_tar(self.good_entries())
        original = os.rename

        def failing_rename(src, dst):
            raise OSError(18, "Invalid cross-device link")

        os.rename = failing_rename
        try:
            with self.assertRaises(ex.PlacementError):
                self.run_extract()
        finally:
            os.rename = original

    def test_destination_already_exists(self):
        (self.workspace / DIR_A).mkdir()
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()

    def test_destination_is_symlink(self):
        elsewhere = self.tmp / "elsewhere"
        elsewhere.mkdir()
        os.symlink(elsewhere, self.workspace / DIR_A)
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()
        self.assertEqual(list(elsewhere.iterdir()), [])

    def test_staging_must_not_exist(self):
        self.staging.mkdir()
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.PlacementError):
            self.run_extract()

    def test_member_limit(self):
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.ArchiveError):
            self.run_extract(max_members=2)

    def test_total_bytes_limit(self):
        self.build_tar(self.good_entries())
        with self.assertRaises(ex.ArchiveError):
            self.run_extract(max_total_bytes=1)

    def test_compressed_archive_rejected(self):
        self.archive = self.tmp / "a.tar.gz"
        with tarfile.open(self.archive, "w:gz") as tf:
            info = tarfile.TarInfo(f"{DIR_A}/classes/A.class")
            info.size = 1
            tf.addfile(info, io.BytesIO(b"x"))
        with self.assertRaises(ex.ArchiveError):
            self.run_extract()

    def test_not_a_tar(self):
        self.archive.write_bytes(b"not a tar")
        with self.assertRaises(ex.ArchiveError):
            self.run_extract()

    def test_missing_archive(self):
        with self.assertRaises(ex.ArchiveError):
            self.run_extract()

    def test_main_returns_nonzero_with_specific_message(self):
        self.build_tar(self.good_entries() + [("/tmp/x", "file", b"x")])
        code = ex.main(
            [
                "--properties", str(self.props),
                "--archive", str(self.archive),
                "--staging", str(self.staging),
                "--workspace", str(self.workspace),
            ]
        )
        self.assertEqual(code, ex.EXIT_FAILURE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
