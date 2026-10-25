from pathlib import Path
import re
import shutil

root = Path(__file__).resolve().parents[1]
archive = root / 'Docs/Archive/RumorQuizzes_TenStages_2026-10-25'
files = list((root / 'Docs/RumorQuizzes').glob('*/*.md'))
assert len(files) == 72 and not archive.exists()
for path in files:
    old = path.read_text(encoding='utf-8')
    copy = archive / path.relative_to(root / 'Docs/RumorQuizzes')
    copy.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, copy)
    rumor = (root / 'Docs/Rumors' / path.relative_to(root / 'Docs/RumorQuizzes')).read_text(encoding='utf-8')
    parts = re.split(r'^## (?:호재|악재) [12] .+\n', rumor, flags=re.M)[1:]
    stages = {re.search(r'사건 ID: `([^`]+)`', part)[1]: re.findall(r'^> (.+)$', part, re.M) for part in parts}
    current = None
    def event_block(match):
        body = match[0]
        event = re.search(r'사건 ID: `([^`]+)`', body)[1]
        def question_block(q):
            band, block = q[1], q[2]
            minimum, label = {'1~3': (1, '1'), '4~6': (2, '2~3'), '7~10': (4, '4~5')}[band]
            block = re.sub(r'최소 공개 단계: \d+', f'최소 공개 단계: {minimum}', block)
            block = re.sub(r'\*\*출제 근거 — \d+단계:\*\*', f'**출제 근거 — {minimum}단계:**', block)
            block = re.sub(r'^> .+$', '> ' + stages[event][minimum - 1], block, flags=re.M)
            return f'### {label}단계 문항\n' + block
        return re.sub(r'^### (1~3|4~6|7~10)단계 문항\n([\s\S]*?)(?=^### |\Z)', question_block, body, flags=re.M)
    text = re.sub(r'^## .+\n\n사건 ID: [\s\S]*?(?=^## |\Z)', event_block, old, flags=re.M)
    assert len(re.findall(r'^### ', text, re.M)) == 12
    path.write_text(text, encoding='utf-8')
print('Remapped 864 authored questions to stage 1 / 2–3 / 4–5; evidence refreshed from five-stage manuscripts.')
