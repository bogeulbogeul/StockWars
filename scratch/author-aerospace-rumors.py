from pathlib import Path
import re
from importlib.util import spec_from_file_location, module_from_spec


def main():
    spec = spec_from_file_location('ent_author', 'scratch/author-ent-rumors.py')
    renderer = module_from_spec(spec)
    spec.loader.exec_module(renderer)
    companies = []
    for line in Path('scratch/aerospace-rumor-drafts.txt').read_text(encoding='utf-8').splitlines():
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
    expected = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: 'Aerospace'", stocks))
    assert len(companies) == len(expected) == 9
    assert {c[0]: c[1] for c in companies} == expected
    folder = Path('Docs/Rumors/Aerospace')
    folder.mkdir(exist_ok=True)
    for stock_id, name, business, events in companies:
        path = folder / f'{stock_id}.md'
        assert not path.exists(), path
        text = renderer.render_company(stock_id, name, business, events)
        text = text.replace('엔터/미디어(Entertainment)', '우주·항공(Aerospace)')
        text = text.replace(' 개봉 전후의 상대 시점은 해당 사건의 예정 개봉일을 기준으로 한다.', '')
        anchor = '## 집필 검수 기준\n\n'
        text = text.replace(anchor, anchor + '지상 시험·탑재 검수·발사 일정·실제 궤도 운용·유인 영업을 구분한다. 모사 토양 시험을 자원 발견이나 채굴 수익으로 바꾸지 않는다. 조건부 예약과 미래 공급 협의는 확정 매출이 아니며, 시험 이상이나 일정 조정을 사고·결함 확정으로 바꾸지 않는다.\n\n')
        path.write_text(text, encoding='utf-8')
    table = ['## 우주·항공 회사별 원고', '',
        '| 회사 | 종목 ID | 호재 1 | 호재 2 | 악재 1 | 악재 2 |', '|---|---|---|---|---|---|']
    for stock_id, name, business, events in companies:
        table.append(f'| [{name}](Aerospace/{stock_id}.md) | `{stock_id}` | ' + ' | '.join(e[1] for e in events) + ' |')
    path = Path('Docs/Rumors/README.md')
    text = path.read_text(encoding='utf-8')
    old = 'IT / 엔터 / 인프라·통신 / 바이오·제약 4개 업종 각 9개 회사, 총 36개 회사·144개 사건·1,440개 단계별 본문 초안'
    new = 'IT / 엔터 / 인프라·통신 / 바이오·제약 / 우주·항공 5개 업종 각 9개 회사, 총 45개 회사·180개 사건·1,800개 단계별 본문 초안'
    assert old in text and '## 우주·항공 회사별 원고' not in text
    text = text.replace(old, new)
    text = text.replace('## 다른 업종', '\n'.join(table) + '\n\n## 다른 업종')
    path.write_text(text, encoding='utf-8')
    print('우주·항공 9개 회사·호재18개·악재18개·360개 본문 작성')


if __name__ == '__main__':
    main()
