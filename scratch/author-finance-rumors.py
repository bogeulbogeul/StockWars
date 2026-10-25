from pathlib import Path
import re
from importlib.util import spec_from_file_location, module_from_spec


def main():
    spec = spec_from_file_location('ent_author', 'scratch/author-ent-rumors.py')
    renderer = module_from_spec(spec)
    spec.loader.exec_module(renderer)
    companies = []
    for line in Path('scratch/finance-rumor-drafts.txt').read_text(encoding='utf-8').splitlines():
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
    expected = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: 'Finance'", stocks))
    assert len(companies) == len(expected) == 9
    assert {c[0]: c[1] for c in companies} == expected
    folder = Path('Docs/Rumors/Finance')
    folder.mkdir(exist_ok=True)
    for stock_id, name, business, events in companies:
        path = folder / f'{stock_id}.md'
        assert not path.exists(), path
        text = renderer.render_company(stock_id, name, business, events)
        text = text.replace('엔터/미디어(Entertainment)', '금융·핀테크(Finance)')
        text = text.replace(' 개봉 전후의 상대 시점은 해당 사건의 예정 개봉일을 기준으로 한다.', '')
        anchor = '## 집필 검수 기준\n\n'
        text = text.replace(anchor, anchor + '고객 예금·운용자산·신탁 재산과 회사 자체 자금을 구분한다. 거래액·신청·수임 증가를 보수·이익 확정으로 바꾸지 않는다. 조달비·판촉비·지원비·충당 부담과 계약 조건을 함께 살핀다. 연체·평가 차이·자료 이의는 확정 손실이나 배상 책임과 구분한다.\n\n게임 내 상장 회사의 가상 사건 원고이며 실제 금융상품 조언이 아니다. 마을 은행·증권사 NPC의 시설 기능이나 미정인 플레이어 예금·대출·월세 연동을 이번 원고로 구현·확정하지 않는다.\n\n')
        path.write_text(text, encoding='utf-8')
    table = ['## 금융·핀테크 회사별 원고', '',
        '| 회사 | 종목 ID | 호재 1 | 호재 2 | 악재 1 | 악재 2 |', '|---|---|---|---|---|---|']
    for stock_id, name, business, events in companies:
        table.append(f'| [{name}](Finance/{stock_id}.md) | `{stock_id}` | ' + ' | '.join(e[1] for e in events) + ' |')
    path = Path('Docs/Rumors/README.md')
    text = path.read_text(encoding='utf-8')
    old = 'IT / 엔터 / 인프라·통신 / 바이오·제약 / 우주·항공 / 유통·소비재 / 에너지·친환경 7개 업종 각 9개 회사, 총 63개 회사·252개 사건·2,520개 단계별 본문 초안'
    new = '전 8개 업종 각 9개 회사, 총 72개 회사·288개 사건·2,880개 단계별 본문 초안'
    assert old in text and '## 금융·핀테크 회사별 원고' not in text
    text = text.replace(old, new)
    text = text.replace('## 보존된 단독 원고', '\n'.join(table) + '\n\n## 보존된 단독 원고')
    path.write_text(text, encoding='utf-8')
    print('금융9개 회사·호재18개·악재18개·360개 본문 작성: 전체72개 회사 원고 구성 완료')


if __name__ == '__main__':
    main()
