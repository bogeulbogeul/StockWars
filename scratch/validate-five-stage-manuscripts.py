from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
base = root / 'Docs/Rumors'
archive = root / 'Docs/Archive/Rumors_TenStages_2026-10-25'
files = list(base.glob('*/*.md'))
assert len(files) == 72
ids = []
for path in files:
    text = path.read_text(encoding='utf-8')
    old = (archive / path.relative_to(base)).read_text(encoding='utf-8')
    stages = re.findall(r'^> (.+)$', text, re.M)
    original = re.findall(r'^> (.+)$', old, re.M)
    assert len(stages) == 20 and len(original) == 40
    assert re.findall(r'^### (\d+)단계', text, re.M) == ['1', '2', '3', '4', '5'] * 4
    assert stages == [original[j * 10 + i] for j in range(4) for i in [0, 3, 5, 7, 9]]
    current_ids = re.findall(r'^사건 ID: `([^`]+)`', text, re.M)
    assert current_ids == re.findall(r'^사건 ID: `([^`]+)`', old, re.M)
    ids += current_ids
    for target in re.findall(r'\]\(([^)]+)\)', text):
        assert (path.parent / target).exists(), (path, target)
assert len(ids) == len(set(ids)) == 288
special = re.findall(r'^> (.+)$', (base / 'BREEZEPOWER_SUPPLY_CONTRACT.md').read_text(encoding='utf-8'), re.M)
breeze = re.findall(r'^> (.+)$', (base / 'Energy/WINDHILL.md').read_text(encoding='utf-8'), re.M)
assert special == breeze[:5]
print('Validated: 72 companies / 288 stable unique events / 1440 stage bodies / all company links.')
print('Validated: 5-stage full texts preserve original stage 10; Breeze standalone matches company event.')
