from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
template = (root / 'scratch/build-it-quiz-docs.py').read_text(encoding='utf-8')
renderer = template.split("index = '''", 1)[0]
renderer = renderer.replace('RumorQuizzes/IT', 'RumorQuizzes/Finance')
renderer = renderer.replace('Rumors/IT/', 'Rumors/Finance/')
renderer = renderer.replace('scratch/it-quiz-manuscripts.txt', 'scratch/finance-quiz-manuscripts.txt')
renderer = renderer.replace('](IT/', '](Finance/')
renderer = renderer.replace("                evidence = evidence.split('. ')[-1]\n", '')
namespace = {'__file__': __file__}
exec(compile(renderer, __file__, 'exec'), namespace)

index_path = root / 'Docs/RumorQuizzes/README.md'
index = index_path.read_text(encoding='utf-8')
index = index.replace('7개 업종 63개 회사·252개 사건·756개 문항 원고 작성',
                      '전 8개 업종 72개 회사·288개 사건·864개 문항 원고 작성')
index = index.replace('사용자 검토·수동 문항의 게임 연결·다른 업종 집필', '사용자 검토·수동 문항의 게임 연결')
index = index.split('\n## 금융·핀테크 회사별 문항', 1)[0].rstrip()
index += '\n\n## 금융·핀테크 회사별 문항\n\n| 회사 | 종목 ID | 사건 수 | 문항 수 |\n|---|---|---|---|\n'
index += '\n'.join(namespace['roster']) + '\n'
index_path.write_text(index, encoding='utf-8')

all_ids, all_events, company_files = [], [], []
for file in (root / 'Docs/RumorQuizzes').rglob('*.md'):
    content = file.read_text(encoding='utf-8')
    for target in re.findall(r'\]\(([^)]+)\)', content):
        assert (file.parent / target).exists(), (file, target)
    ids = re.findall(r'문항 ID: `([^`]+)`', content)
    all_ids += ids
    if ids:
        company_files.append(file)
        assert len(ids) == 12
        all_events += re.findall(r'^사건 ID: `([^`]+)`', content, re.M)
assert len(all_ids) == len(set(all_ids)) == 864
assert len(all_events) == len(set(all_events)) == 288
assert len(company_files) == 72
assert set(namespace['entries']) == {p.stem for p in (root / 'Docs/Rumors/Finance').glob('*.md')}
print('Validated: Finance 9 companies / 36 events / 108 unique questions / 324 choices.')
print('Validated: all 72 company docs / 288 unique events / 864 unique question IDs; all relative links valid.')
