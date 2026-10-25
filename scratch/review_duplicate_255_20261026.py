"""Review the exact 255 deferred image paths without changing any image."""
from collections import Counter, defaultdict
import hashlib
import json
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
audit = json.loads((ROOT / 'scratch/duplicate-image-audit-2026-10-26.json').read_text(encoding='utf-8-sig'))
rows = []
for group in audit['groups']:
    for image in group['files']:
        if image['path'].startswith('output/') and not image['protection']:
            rows.append({'path': image['path'], 'bytes': group['bytes_each'], 'sha256': group['sha256'],
                         'copies': [f['path'] for f in group['files'] if f['path'] != image['path']]})
assert len(rows) == 255


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


producers = {
    'exterior-wall-rigidbody-v1': 'web/tests/arrivalBench.browser.cjs',
    'indoor-furniture-rigidbody-v1': 'web/tests/arrivalBench.browser.cjs',
    'indoor-wall-rigidbody-v1': 'web/tests/arrivalBench.browser.cjs',
    'jump-check-v1': 'web/tests/arrivalBench.browser.cjs',
    'information-sofa-seat-penetration-check-v1': 'scratch/check-information-sofa-penetration.cjs',
    'rumor-letter-ui-2026-10-25': 'scratch/check-rumor-letter.cjs',
    'rumor-olive-ui-2026-10-25': 'scratch/check-rumor-olive.cjs',
    'rumor-quiz-stamp-2026-10-25': 'scratch/check-rumor-stamp.cjs',
}
pair_candidates = {}
for row in rows:
    path = Path(row['path'])
    directory = path.parts[1]
    web_path = path.with_name(path.name.replace('desktop-', 'web-', 1)).as_posix()
    if path.name.startswith('desktop-') and directory in producers and web_path in row['copies']:
        pair_candidates[row['path']] = web_path

# Detect literal readers/links, including local relative links and global filenames.
readers = defaultdict(set)
names = {Path(p).name for p in pair_candidates}
pattern = re.compile(r'(?<![\w.-])(?:' + '|'.join(re.escape(n) for n in names) + r')(?![\w.-])')
text_extensions = {'.md', '.json', '.txt', '.py', '.ps1', '.js', '.mjs', '.cjs', '.html', '.css'}
skip = {'.git', 'node_modules', '.pnpm-store', '__pycache__', 'runtime'}
for folder in ('Docs', 'output', 'scratch', 'web', 'electron-app/src'):
    for base, directories, filenames in os.walk(ROOT / folder, followlinks=False):
        directories[:] = [d for d in directories if d not in skip and not Path(base, d).is_symlink()]
        for filename in filenames:
            source = Path(base, filename)
            if source.suffix not in text_extensions or re.search(r'audit|cleanup|duplicate', filename, re.I):
                continue
            text = source.read_text(encoding='utf-8', errors='ignore')
            if source.suffix == '.html':
                text = re.sub(r'data:[^,\s"<>]{0,100};base64,[A-Za-z0-9+/=]+', '', text)
            found = set(pattern.findall(text))
            for candidate in pair_candidates:
                if Path(candidate).name in found:
                    readers[candidate].add(source.relative_to(ROOT).as_posix())

for row in rows:
    path = ROOT / row['path']
    row['status'] = 'preserve'
    row['verified_unchanged'] = path.is_file() and digest(path) == row['sha256']
    directory = Path(row['path']).parts[1]
    if not row['verified_unchanged']:
        row['reason'] = 'Changed/missing since initial audit; preserve and re-evaluate'
    elif row['path'] in pair_candidates:
        keep = pair_candidates[row['path']]
        row['preserved_copy'] = keep
        row['producer'] = producers[directory]
        row['literal_references'] = sorted(readers[row['path']])
        row['preserved_hash_verified'] = (ROOT / keep).is_file() and digest(ROOT / keep) == row['sha256']
        if row['literal_references'] or not row['preserved_hash_verified']:
            row['reason'] = 'Literal reference or changed counterpart; preserve'
        else:
            row['status'] = 'candidate'
            row['reason'] = 'Redundant desktop verification screenshot; identical same-folder web capture retained'
            row['record_policy'] = 'Keep desktop/web JSON reports and producer; record screenshot equivalence in folder README when deleting'
    elif directory in {'somangi-walk-hip-seam-v2', 'somangi-walk-height-fixed-preview', 'buddy-hop-corrective-v24'}:
        row['reason'] = 'Numbered motion/inspection sequence; glob/index-based packaging requires path and frame count'
        row['evidence'] = ['output/somangi-walk-height-fixed-preview/package.py', 'output/somangi-walk-hip-seam-v2/README.md']
    elif directory == 'black-cat-sprite-test':
        row['reason'] = 'Character input/base or QA contact sheet retained with each version'
    elif directory == 'building-retouch-final':
        row['reason'] = 'Comparison page dynamically builds material-v1 filenames'
        row['evidence'] = ['output/building-retouch-final/comparison.html']
    elif directory in producers or directory == 'town-performance-v2':
        row['reason'] = 'Retain web canonical capture, non-identical pair, or distinct test-stage evidence'
    else:
        row['reason'] = 'Concept/adopted art, source motion edit, or distinct historical comparison; preserve source path'

selected = [r for r in rows if r['status'] == 'candidate']
summary = {'reviewed': len(rows), 'candidates': len(selected), 'candidate_bytes': sum(r['bytes'] for r in selected),
           'preserved': len(rows) - len(selected), 'changed_or_missing': sum(not r['verified_unchanged'] for r in rows),
           'images_deleted_or_modified': 0}
result = {'summary': summary, 'rows': rows}
(ROOT / 'scratch/duplicate-255-review-2026-10-26.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
lines = ['# 보류 중복 이미지 255개 재검토 — 2026-10-26', '',
         '✅ 검토 완료. 이미지·원본·게임 파일은 삭제하거나 수정하지 않았다.', '',
         f"- 검토 {len(rows)}개 / 추가 삭제 후보 {len(selected)}개·{summary['candidate_bytes']:,}바이트 / 유지 {summary['preserved']}개.",
         '- 후보는 같은 검수 폴더의 desktop 캡처와 web 캡처가 SHA-256까지 일치하는 경우다. web 캡처를 보존하고 환경별 JSON 검증 기록과 촬영 스크립트도 유지한다.',
         '- 실제 삭제 시 폴더 README에 desktop → web 대조표를 남겨 검수 기록과 와일드카드 이미지 안내를 보완해야 한다. 아직 삭제하지 않았다.',
         '- 파일명 직접 참조 검색과 생산 스크립트 검토를 수행했다. 동적으로 조합되는 모든 소비 경로의 부재를 완전히 증명하는 검사는 아니다.', '',
         '## 추가 삭제 후보', '', '| 삭제 후보 | 동일한 보존본 | 바이트 |', '|---|---|---:|']
for row in selected:
    lines.append(f"| `{row['path']}` | `{row['preserved_copy']}` | {row['bytes']:,} |")
lines += ['', '## 유지 분류', '', '| 이유 | 파일 수 |', '|---|---:|']
for reason, count in Counter(r['reason'] for r in rows if r['status'] != 'candidate').items():
    lines.append(f'| {reason} | {count} |')
lines += ['', '모든 255개 경로의 판정·해시·근거는 `scratch/duplicate-255-review-2026-10-26.json`에 기록했다. 게임 변경이 없어 플레이 테스트는 수행하지 않았다.', '']
(ROOT / 'Docs/DUPLICATE_IMAGE_255_REVIEW_2026-10-26.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps(summary, indent=2), flush=True)
print('Preservation reasons:', json.dumps(Counter(r['reason'] for r in rows if r['status'] != 'candidate'), indent=2), flush=True)
