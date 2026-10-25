from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
template = (root / 'scratch/build-it-quiz-docs.py').read_text(encoding='utf-8')
# Reuse the reviewed company document renderer without rewriting the IT index.
renderer = template.split("index = '''", 1)[0]
renderer = renderer.replace('RumorQuizzes/IT', 'RumorQuizzes/Entertainment')
renderer = renderer.replace('Rumors/IT/', 'Rumors/Entertainment/')
renderer = renderer.replace('scratch/it-quiz-manuscripts.txt', 'scratch/entertainment-quiz-manuscripts.txt')
renderer = renderer.replace('](IT/', '](Entertainment/')
renderer = renderer.replace("                evidence = evidence.split('. ')[-1]\n", '')
namespace = {'__file__': __file__}
exec(compile(renderer, __file__, 'exec'), namespace)

index_path = root / 'Docs/RumorQuizzes/README.md'
index = index_path.read_text(encoding='utf-8')
index = index.replace('IT 9개 회사·36개 사건·108개 문항 원고 작성',
                      'IT·엔터 18개 회사·72개 사건·216개 문항 원고 작성')
index = index.split('\n## 엔터 회사별 문항', 1)[0].rstrip()
index += '\n\n## 엔터 회사별 문항\n\n| 회사 | 종목 ID | 사건 수 | 문항 수 |\n|---|---|---|---|\n'
index += '\n'.join(namespace['roster']) + '\n'
index_path.write_text(index, encoding='utf-8')

files = list((root / 'Docs/RumorQuizzes').rglob('*.md'))
all_ids = []
for file in files:
    content = file.read_text(encoding='utf-8')
    for target in re.findall(r'\]\(([^)]+)\)', content):
        assert (file.parent / target).exists(), (file, target)
    all_ids += re.findall(r'문항 ID: `([^`]+)`', content)
assert len(all_ids) == len(set(all_ids)) == 216
print('Validated: Entertainment 9 companies / 36 events / 108 questions / 324 distinct-within-question choices.')
print('Validated: combined 216 unique question IDs, all document links, minimum-stage evidence 1/4/7.')
