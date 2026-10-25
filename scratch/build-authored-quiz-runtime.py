"""Compile reviewed company quiz Markdown into game modules."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
source = root / 'Docs/RumorQuizzes'
target = root / 'web/js/data/rumorQuizzes'
target.mkdir(parents=True, exist_ok=True)
sectors = ['IT', 'Entertainment', 'Infrastructure', 'Bio', 'Aerospace', 'Retail', 'Energy', 'Finance']
imports, exports, ids, events = [], [], set(), set()
count = 0
for sector in sectors:
    files = sorted((source / sector).glob('*.md'))
    assert len(files) == 9, sector
    for file in files:
        text = file.read_text(encoding='utf-8')
        parts = re.split(r'^## (.+)\n\n사건 ID: `([^`]+)`\n', text, flags=re.M)
        rows = []
        assert len(parts) == 13, file
        for offset in range(1, len(parts), 3):
            title, event_id, body = parts[offset:offset + 3]
            assert event_id not in events
            events.add(event_id)
            sections = re.split(r'^### (\d+)(?:~(\d+))?단계 문항\n', body, flags=re.M)
            assert len(sections) == 16
            for i in range(1, len(sections), 3):
                minimum, maximum, block = sections[i:i + 3]
                match = re.search(r'문항 ID: `([^`]+)` · 최소 공개 단계: (\d+)\n\n(.+?)\n\n1\. ', block, re.S)
                question_id, level, question = match.groups()
                assert int(level) == int(minimum)
                assert int(minimum) in range(1, 6) and int(maximum or minimum) == int(minimum)
                assert question_id not in ids
                ids.add(question_id)
                choices = re.findall(r'^[123]\. (.+)$', block, re.M)
                correct = '①②③'.index(re.search(r'\*\*정답: ([①②③])\*\*', block)[1])
                explanation = re.search(r'^\*\*해설:\*\* (.+)$', block, re.M)[1]
                evidence = re.search(r'^> (.+)$', block, re.M)[1]
                assert len(choices) == len(set(choices)) == 3
                assert all([question, explanation, evidence])
                rows.append(dict(id=question_id, eventId=event_id, minLevel=int(level),
                                 question=question, choices=choices, correctIndex=correct,
                                 explanation=explanation, evidence=evidence))
        assert len(rows) == 20
        folder = target / sector
        folder.mkdir(exist_ok=True)
        contents = '// Generated from Docs/RumorQuizzes; edit the manuscript and rebuild.\nexport default [\n'
        contents += ',\n'.join('    ' + json.dumps(row, ensure_ascii=False, separators=(',', ':')) for row in rows)
        contents += '\n];\n'
        (folder / f'{file.stem}.js').write_text(contents, encoding='utf-8')
        alias = f'bank{len(imports)}'
        imports.append(f"import {alias} from './rumorQuizzes/{sector}/{file.stem}.js';")
        exports.append('...' + alias)
        count += len(rows)
assert len(events) == 288 and count == len(ids) == 1440
index = '\n'.join(imports) + '\n\nexport const AUTHORED_RUMOR_QUIZZES = [\n'
index += '\n'.join('    ' + name + ',' for name in exports) + '\n];\n'
(target.parent / 'authoredRumorQuizzes.js').write_text(index, encoding='utf-8')
print(f'Compiled {len(imports)} company modules / {len(events)} events / {count} authored questions.')
