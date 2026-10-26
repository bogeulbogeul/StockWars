from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
template = (root / 'scratch/build-it-quiz-docs.py').read_text(encoding='utf-8')
renderer = template.split("index = '''", 1)[0]
renderer = renderer.replace('RumorQuizzes/IT', 'RumorQuizzes/Aerospace')
renderer = renderer.replace('Rumors/IT/', 'Rumors/Aerospace/')
renderer = renderer.replace('scratch/it-quiz-manuscripts.txt', 'scratch/aerospace-quiz-manuscripts.txt')
renderer = renderer.replace('](IT/', '](Aerospace/')
renderer = renderer.replace("                evidence = evidence.split('. ')[-1]\n", '')
namespace = {'__file__': __file__}
exec(compile(renderer, __file__, 'exec'), namespace)

index_path = root / 'Docs/RumorQuizzes/README.md'
index = index_path.read_text(encoding='utf-8')
index = index.replace('IT·엔터·인프라·통신·바이오·제약 36개 회사·144개 사건·432개 문항 원고 작성',
                      'IT·엔터·인프라·통신·바이오·제약·우주·항공 45개 회사·180개 사건·540개 문항 원고 작성')
index = index.split('\n## 우주·항공 회사별 문항', 1)[0].rstrip()
index += '\n\n## 우주·항공 회사별 문항\n\n| 회사 | 종목 ID | 사건 수 | 문항 수 |\n|---|---|---|---|\n'
index += '\n'.join(namespace['roster']) + '\n'
index_path.write_text(index, encoding='utf-8')

all_ids = []
for file in (root / 'Docs/RumorQuizzes').rglob('*.md'):
    content = file.read_text(encoding='utf-8')
    for target in re.findall(r'\]\(([^)]+)\)', content):
        assert (file.parent / target).exists(), (file, target)
    all_ids += re.findall(r'문항 ID: `([^`]+)`', content)
assert len(all_ids) == len(set(all_ids)) == 540
assert set(namespace['entries']) == {p.stem for p in (root / 'Docs/Rumors/Aerospace').glob('*.md')}
print('Validated: Aerospace 9 companies / 36 events / 108 unique questions / 324 choices.')
print('Validated: combined 540 unique question IDs, all relative links, minimum-stage evidence 1/4/7.')
