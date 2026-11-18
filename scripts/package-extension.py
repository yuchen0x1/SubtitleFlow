"""Validate dist and create reproducible GitHub Release assets."""
import hashlib
import json
import os
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUT = ROOT / "artifacts"
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
VERSION = PACKAGE["version"]
MANIFEST_SOURCE = ROOT / "apps/extension/public/manifest.json"
MANIFEST = json.loads((DIST / "manifest.json").read_text(encoding="utf-8"))
SOURCE = json.loads(MANIFEST_SOURCE.read_text(encoding="utf-8"))
LOCK = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
TAG = os.environ.get("RELEASE_TAG")

if (
    not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", VERSION)
    or MANIFEST["version"] != VERSION
    or SOURCE["version"] != VERSION
    or LOCK["version"] != VERSION
    or LOCK["packages"][""]["version"] != VERSION
    or (TAG and TAG != f"v{VERSION}")
):
    raise SystemExit("Package, lockfile, manifest and release tag must agree on a stable version.")

files = {
    path.relative_to(DIST).as_posix(): path.read_bytes()
    for path in sorted(DIST.rglob("*"))
    if path.is_file()
}
entries = {
    MANIFEST["action"]["default_popup"], MANIFEST["options_page"],
    MANIFEST["background"]["service_worker"], "offscreen.html", "audio-worklet.js",
}
for script in MANIFEST["content_scripts"]:
    entries.update(script["js"])
if any(not files.get(entry) for entry in entries):
    raise SystemExit("A required extension entry is missing or empty.")
if any(name.endswith(".map") or "sourceMappingURL=" in body.decode("utf-8", "ignore")
       for name, body in files.items() if name.endswith((".map", ".js", ".css"))):
    raise SystemExit("Release assets must not include or reference source maps.")

files["LICENSE"] = (ROOT / "LICENSE").read_bytes()
OUT.mkdir(exist_ok=True)
archive = OUT / f"SubtitleFlow-{VERSION}-Chromium.zip"
with ZipFile(archive, "w") as package:
    for name, body in sorted(files.items()):
        entry = ZipInfo(name)
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        package.writestr(entry, body, compress_type=ZIP_DEFLATED, compresslevel=9)
with ZipFile(archive) as package:
    if package.testzip() is not None or set(package.namelist()) != set(files):
        raise SystemExit("Archive failed integrity verification.")

digest = hashlib.sha256(archive.read_bytes()).hexdigest()
metadata = {
    "schemaVersion": 1,
    "version": VERSION,
    "channel": "stable",
    "platform": "chromium",
    "browsers": ["chrome", "edge"],
    "architecture": "any",
    "minimumBrowserVersion": MANIFEST["minimum_chrome_version"],
    "installation": "manual-unpacked",
    "asset": archive.name,
    "bytes": archive.stat().st_size,
    "sha256": digest,
}
metadata_file = OUT / "release-metadata.json"
metadata_file.write_bytes((json.dumps(metadata, indent=2) + "\n").encode())
metadata_digest = hashlib.sha256(metadata_file.read_bytes()).hexdigest()
(OUT / "SHA256SUMS").write_bytes(
    f"{digest}  {archive.name}\n{metadata_digest}  {metadata_file.name}\n".encode()
)
print(f"Verified {len(files)} files in {archive.name} (SHA-256 {digest})")
