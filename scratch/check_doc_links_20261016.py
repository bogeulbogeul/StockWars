from pathlib import Path
import re
import posixpath
root = Path(__file__).resolve().parents[1]
count = 0
bad = []
for p in list((root/'Docs').rglob('*.md')) + [root/'AGENTS.md']:
    text = p.read_text(encoding='utf-8-sig', errors='surrogateescape')
    for target in re.findall(r'!?\[[^\]]*\]\(([^\s)]+)\)', text):
        if re.match(r'^[a-zA-Z]+:', target) or target.startswith(('#','/')):
            continue
        count += 1
        name, _, anchor = target.partition('#')
        dest = p.parent / name
        if not dest.exists():
            bad.append((str(p.relative_to(root)), target))
        elif anchor:
            target_text = dest.read_text(encoding='utf-8-sig', errors='surrogateescape')
            headings = re.findall(r'^#+\s+(.+)$', target_text, re.M)
            slugs = [re.sub(r'[^\w\s-]', '', heading.lower()).strip().replace(' ', '-') for heading in headings]
            if f'id="{anchor}"' not in target_text and anchor not in slugs:
                bad.append((str(p.relative_to(root)), target))
print(f'Checked {count} local links; {len(bad)} missing targets:')
for row in bad:
    print(*row, sep=' -> ')
raise SystemExit(bool(bad))
