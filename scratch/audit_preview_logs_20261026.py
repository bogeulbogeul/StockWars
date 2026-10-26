"""Conservative audit of disposable preview pages and successful build logs."""
import hashlib
import json
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', 'node_modules', '.pnpm-store', 'dist', '__pycache__', 'runtime'}
TEXT = {'.md', '.txt', '.json', '.py', '.ps1', '.js', '.mjs', '.cjs', '.html', '.css', '.yaml'}
files = []
for base, dirs, names in os.walk(ROOT, followlinks=False):
    dirs[:] = [d for d in dirs if d not in SKIP and not Path(base, d).is_symlink()]
    files.extend(Path(base, n) for n in names if not Path(base, n).is_symlink())
targets = {p.resolve(): p for p in files if p.suffix in {'.html', '.log'}
           and p.relative_to(ROOT).parts[0] in {'output', 'scratch'}}
references = {p: [] for p in targets}
generators = {p: [] for p in targets}
token_pattern = re.compile(r'''["'`(]([^"'`<>\r\n()]*?\.(?:html|log))(?:[?#][^"'`<>\r\n()]*)?["'`)]''')
script_ext = {'.py', '.ps1', '.js', '.cjs', '.mjs'}

for source in files:
    if source.suffix not in TEXT or source == Path(__file__) or 'cleanup' in source.name.lower():
        continue
    text = source.read_text(encoding='utf-8', errors='ignore')
    for line in text.splitlines():
        for token in token_pattern.findall(line):
            token = token.strip().replace('\\', '/')
            for base in (source.parent, ROOT):
                target = (base / token).resolve()
                if target not in targets or target == source.resolve():
                    continue
                relative_source = source.relative_to(ROOT).as_posix()
                # A writer is allowed to regenerate an artifact; all readers stay linked.
                is_writer = source.suffix in script_ext and re.search(
                    r'write_text|writeFile|Set-Content|Out-File|redirect_stdout|redirect_stderr|stdout\s*=|stderr\s*=', line
                ) and not re.search(r'read_text|readFile|fetch\(|goto\(|open\(', line)
                if is_writer:
                    generators[target].append(relative_source)
                else:
                    references[target].append(relative_source)

selected = []
kept = []
for target in targets:
    reason = None
    content = target.read_text(encoding='utf-8', errors='ignore')
    refs = sorted(set(references[target]))
    is_storage = any(part.lower() in {'profile', 'leveldb', 'storage', 'indexeddb'} for part in target.parts)
    if not refs and not is_storage:
        if target.suffix == '.log':
            if not content.strip():
                reason = 'Empty unreferenced log'
            elif re.search(r'Blender quit|finished|success|completed', content, re.I) and not re.search(
                r'error|warning|traceback|failed|needs.review|too low|"(?:ok|passed|success)"\s*:\s*false', content, re.I
            ):
                reason = 'Unreferenced successful process log; no error/warning markers'
        elif generators[target] and 'template' not in target.name.lower():
            # Embedded media can be a unique historical asset; retain those pages.
            if not re.search(r'data:|base64|__ITEMS__|__DOG__', content, re.I):
                reason = 'Generated unreferenced preview without embedded media or template tokens'
    row = {'path': target.relative_to(ROOT).as_posix(), 'bytes': target.stat().st_size,
           'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    if reason:
        row.update(reason=reason, generators=sorted(set(generators[target])))
        selected.append(row)
    else:
        row.update(references=refs[:8])
        kept.append(row)

report = {'selected': selected, 'kept': kept}
destination = ROOT / 'scratch/preview-log-cleanup-2026-10-26.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
for extension in ('.html', '.log'):
    group = [p for p in selected if p['path'].endswith(extension)]
    print(extension, 'selected:', len(group), 'bytes:', sum(p['bytes'] for p in group))
print('Retained:', len(kept))
print('Report:', destination)
