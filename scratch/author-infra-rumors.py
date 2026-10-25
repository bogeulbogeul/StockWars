from pathlib import Path
import re
from importlib.util import spec_from_file_location, module_from_spec


def main():
    # 기존 업종의 문서 구조만 재사용하고 소재와 본문은 신규 원고를 읽는다.
    spec = spec_from_file_location('ent_author', 'scratch/author-ent-rumors.py')
    renderer = module_from_spec(spec)
    spec.loader.exec_module(renderer)
    companies = []
    for line in Path('scratch/infra-rumor-drafts.txt').read_text(encoding='utf-8').splitlines():
        if not line:
            continue
        if line.startswith('@'):
            stock_id, name, business = line[1:].split('|')
            companies.append((stock_id, name, business, []))
        else:
            parts = line.split('|')
            assert len(parts) == 12, (parts[1], len(parts))
            companies[-1][3].append((parts[0], parts[1], parts[2:]))
    stocks = Path('web/js/data/stocksData.js').read_text(encoding='utf-8')
    expected = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: 'Infrastructure'", stocks))
    assert len(companies) == len(expected) == 9
    assert {c[0]: c[1] for c in companies} == expected
    folder = Path('Docs/Rumors/Infrastructure')
    folder.mkdir(exist_ok=True)
    for stock_id, name, business, events in companies:
        path = folder / f'{stock_id}.md'
        assert not path.exists(), path
        text = renderer.render_company(stock_id, name, business, events)
        text = text.replace('엔터/미디어(Entertainment)', '인프라·통신(Infrastructure)')
        text = text.replace(' 개봉 전후의 상대 시점은 해당 사건의 예정 개봉일을 기준으로 한다.', '')
        path.write_text(text, encoding='utf-8')
    table = ['## 인프라·통신 회사별 원고', '',
        '| 회사 | 종목 ID | 호재 1 | 호재 2 | 악재 1 | 악재 2 |', '|---|---|---|---|---|---|']
    for stock_id, name, business, events in companies:
        table.append(f'| [{name}](Infrastructure/{stock_id}.md) | `{stock_id}` | ' + ' | '.join(e[1] for e in events) + ' |')
    path = Path('Docs/Rumors/README.md')
    text = path.read_text(encoding='utf-8')
    old = 'IT·엔터 각 9개 회사, 총 18개 회사·72개 사건·720개 단계별 본문 초안'
    new = 'IT·엔터·인프라·통신 3개 업종 각 9개 회사, 총 27개 회사·108개 사건·1,080개 단계별 본문 초안'
    assert old in text and '## 인프라·통신 회사별 원고' not in text
    text = text.replace(old, new)
    text = text.replace('## 다른 업종', '\n'.join(table) + '\n\n## 다른 업종')
    path.write_text(text, encoding='utf-8')
    print('인프라·통신 9개 회사·호재18개·악재18개·360개 본문 작성')


if __name__ == '__main__':
    main()
