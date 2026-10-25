"""Audit redundant artifacts; deletion is performed from the reviewed manifest."""
import hashlib
import json
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'scratch/cleanup-2026-10-26.json'
EXCLUDED = {'.git', 'node_modules', '.pnpm-store', 'dist', '__pycache__'}
TEXT = {'.md', '.txt', '.json', '.js', '.mjs', '.cjs', '.html', '.css', '.py', '.ps1', '.yaml', '.yml'}


def files_under(folder):
    for base, dirs, names in os.walk(folder, followlinks=False):
        dirs[:] = [d for d in dirs if d not in EXCLUDED and not Path(base, d).is_symlink()]
        for name in names:
            path = Path(base, name)
            if not path.is_symlink():
                yield path


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def relative(path):
    return path.relative_to(ROOT).as_posix()


all_files = list(files_under(ROOT))
texts = []
for path in all_files:
    if path.suffix.lower() in TEXT and path != REPORT and path != Path(__file__):
        if path.stat().st_size < 5_000_000:
            texts.append(path.read_text(encoding='utf-8', errors='ignore').lower())
corpus = '\n'.join(texts)
items = []


def add(path, reason, preserved=None):
    row = {'path': relative(path), 'bytes': path.stat().st_size, 'reason': reason,
           'sha256': digest(path)}
    if preserved:
        row['preserved'] = [relative(p) for p in preserved]
    items.append(row)


for path in all_files:
    if path.parts[len(ROOT.parts)] not in {'output', 'scratch'}:
        continue
    if path.suffix.lower() == '.blend1':
        original = path.with_suffix('.blend')
        if original.is_file() and original.stat().st_size > 0:
            add(path, 'Blender automatic backup; primary .blend retained', [original])
    elif path.suffix.lower() == '.zip':
        # Remove only archives whose every member has an identical extracted file.
        preserved = []
        with zipfile.ZipFile(path) as archive:
            entries = [e for e in archive.infolist() if not e.is_dir()]
            for entry in entries:
                member = Path(entry.filename.replace('\\', '/'))
                if member.is_absolute() or '..' in member.parts:
                    break
                candidates = [path.parent / member, path.with_suffix('') / member]
                found = None
                for candidate in candidates:
                    if candidate.is_file() and candidate.stat().st_size == entry.file_size:
                        with archive.open(entry) as stream:
                            archive_hash = hashlib.file_digest(stream, 'sha256').hexdigest()
                        if digest(candidate) == archive_hash:
                            found = candidate
                            break
                if found is None:
                    break
                preserved.append(found)
            else:
                if entries:
                    add(path, 'ZIP fully duplicated by SHA-256 verified extracted files', preserved)
    elif path.parent == ROOT / 'scratch' and path.suffix.lower() in {'.png', '.jpg', '.jpeg'}:
        # Keep references, guides and all screenshots named by code or documentation.
        if path.name.lower() not in corpus and not any(
            tag in path.stem.lower() for tag in ('base', 'reference', 'guide', 'grid')
        ):
            add(path, 'Unreferenced scratch screenshot; no code/document filename reference')

REPORT.write_text(json.dumps({'root': str(ROOT), 'items': items}, ensure_ascii=False, indent=2), encoding='utf-8')
summary = {}
for item in items:
    group = item['reason']
    row = summary.setdefault(group, {'files': 0, 'bytes': 0})
    row['files'] += 1
    row['bytes'] += item['bytes']
print(json.dumps(summary, indent=2))
print('Manifest:', REPORT)
