"""Read-only SHA-256 image duplicate audit; never deletes or rewrites images."""
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
SKIP = {'.git', 'node_modules', '.pnpm-store', '__pycache__', 'runtime'}
TEXT = {'.md', '.json', '.txt', '.py', '.ps1', '.js', '.mjs', '.cjs', '.html', '.css', '.yaml'}
OUTPUT = ROOT / 'scratch/duplicate-image-audit-2026-10-26.json'


def walk(folder):
    for base, dirs, names in os.walk(folder, followlinks=False):
        dirs[:] = [d for d in dirs if d not in SKIP and not Path(base, d).is_symlink()]
        for name in names:
            path = Path(base, name)
            if not path.is_symlink():
                yield path


def relative(path):
    return path.relative_to(ROOT).as_posix()


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


images = []
text_files = []
for folder in ('output', 'scratch', 'web', 'Docs', 'electron-app/dist/win-unpacked/resources/web'):
    for path in walk(ROOT / folder):
        if path.suffix.lower() in EXTENSIONS:
            images.append(path)
        elif path.suffix.lower() in TEXT:
            text_files.append(path)
text_files.append(ROOT / 'AGENTS.md')
sizes = defaultdict(list)
for path in images:
    sizes[path.stat().st_size].append(path)
hashes = defaultdict(list)
hashed = 0
for size, paths in sizes.items():
    if len(paths) < 2:
        continue
    for path in paths:
        hashes[(size, digest(path))].append(path)
        hashed += 1
print('Image hashes compared:', hashed, flush=True)

referenced_names = set()
documented_output_dirs = set()
name_pattern = re.compile(r'(?<![\w.-])[\w.-]+\.(?:png|jpe?g|webp|gif)\b', re.I)
directory_pattern = re.compile(r'output[/\\]([\w.-]+)[/\\]', re.I)
for source in text_files:
    if 'cleanup' in source.name.lower() or 'audit' in source.name.lower():
        continue
    content = source.read_text(encoding='utf-8', errors='ignore')
    # Embedded image payloads cannot contain useful filesystem references.
    if source.suffix == '.html' and 'base64,' in content:
        content = re.sub(r'data:[^,\s"<>]{0,100};base64,[A-Za-z0-9+/=]+', '', content)
    referenced_names.update(name.lower() for name in name_pattern.findall(content))
    if source.suffix == '.md':
        documented_output_dirs.update(name.lower() for name in directory_pattern.findall(content))


def protected_reason(path):
    parts = path.relative_to(ROOT).parts
    if parts[0] in {'web', 'electron-app', 'Docs'}:
        return 'Game/runtime/document image: preserve path'
    if parts[0] == 'output' and parts[1].lower() in documented_output_dirs:
        return 'Output directory named in documentation: preserve pending role review'
    if path.name.lower() in referenced_names:
        return 'Filename appears in source or documentation: preserve path'
    if any(re.search(r'frame|atlas|sheet|texture|portrait|source|input|reference|original|before', p, re.I) for p in parts[1:]):
        return 'Source/texture/animation role: preserve path'
    return None


groups = []
scratch_candidates = []
for (size, sha), paths in hashes.items():
    if len(paths) < 2:
        continue
    rows = [{'path': relative(path), 'protection': protected_reason(path)} for path in paths]
    groups.append({'bytes_each': size, 'sha256': sha, 'files': rows})
    non_scratch = [row for row in rows if not row['path'].startswith('scratch/')]
    for row in rows:
        if row['path'].startswith('scratch/') and not row['protection'] and non_scratch:
            scratch_candidates.append({'path': row['path'], 'bytes': size, 'sha256': sha,
                                       'identical_preserved_copy': non_scratch[0]['path']})
groups.sort(key=lambda group: group['bytes_each'] * (len(group['files']) - 1), reverse=True)
summary = {
    'scanned_images': len(images),
    'exact_duplicate_groups': len(groups),
    'files_in_duplicate_groups': sum(len(group['files']) for group in groups),
    'theoretical_duplicate_bytes_including_required_copies': sum(group['bytes_each'] * (len(group['files']) - 1) for group in groups),
    'unreferenced_scratch_candidates': len(scratch_candidates),
    'unreferenced_scratch_candidate_bytes': sum(row['bytes'] for row in scratch_candidates),
    'note': 'Read-only audit. Duplicate hashes do not establish that a file path can be deleted; runtime copies and animation frames remain necessary.'
}
OUTPUT.write_text(json.dumps({'summary': summary, 'scratch_candidates': scratch_candidates, 'groups': groups},
                             ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, indent=2), flush=True)
print('Report:', OUTPUT, flush=True)
