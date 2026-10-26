from pathlib import Path
import re
from importlib.util import spec_from_file_location, module_from_spec


def main():
    spec = spec_from_file_location('ent_author', 'scratch/author-ent-rumors.py')
    renderer = module_from_spec(spec)
    spec.loader.exec_module(renderer)
    companies = []
    for line in Path('scratch/energy-rumor-drafts.txt').read_text(encoding='utf-8').splitlines():
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
    expected = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: 'Energy'", stocks))
    assert len(companies) == len(expected) == 9
    assert {c[0]: c[1] for c in companies} == expected
    baseline_path = Path('Docs/Rumors/BREEZEPOWER_SUPPLY_CONTRACT.md')
    baseline = re.findall(r'^> (.+)$', baseline_path.read_text(encoding='utf-8'), re.M)
    assert len(baseline) == 10
    folder = Path('Docs/Rumors/Energy')
    folder.mkdir(exist_ok=True)
    for stock_id, name, business, events in companies:
        path = folder / f'{stock_id}.md'
        assert not path.exists(), path
        text = renderer.render_company(stock_id, name, business, events)
        text = text.replace('엔터/미디어(Entertainment)', '에너지·친환경(Energy)')
        text = text.replace(' 개봉 전후의 상대 시점은 해당 사건의 예정 개봉일을 기준으로 한다.', '')
        anchor = '## 집필 검수 기준\n\n'
        text = text.replace(anchor, anchor + '시험 효율·실제 운전·고객 채택·양산 원가를 구분한다. 장비 공급과 시설 가동·판매 승인, 전력 거래와 발전량, 탄소 포집과 후속 운송·처리는 별개다. 부분 이상을 전체 시설 사고로 확대하지 않고, 원가 절감은 추가 장비·검사·교체 비용을 포함해 판단할 여지를 남긴다.\n\n')
        if stock_id == 'WINDHILL':
            start = text.index('## 호재 1 ')
            end = text.index('## 호재 2 ')
            section = text[start:end]
            iterator = iter(baseline)
            section = re.sub(r'^> .+$', lambda m: '> ' + next(iterator), section, flags=re.M)
            section = section.replace('사건 ID: `R10_WINDHILL_P1`', '사건 ID: `R10_WINDHILL_P1`\n\n[기존 계약설 원고](../BREEZEPOWER_SUPPLY_CONTRACT.md)의 10단계 본문을 그대로 수록했다. 같은 사건의 회사별 관리본이며 신규 사건으로 중복 집계하지 않는다. 기존 단독 문서는 보존한다.')
            text = text[:start] + section + text[end:]
        path.write_text(text, encoding='utf-8')
    table = ['## 에너지·친환경 회사별 원고', '',
        '브리즈파워의 호재 ①은 기존 계약설 1건의 관리 통합이다. 에너지 36개 사건 중 35개·350개 본문은 신규 작성, 1개·10개 본문은 기존 원고를 그대로 수록했다.', '',
        '| 회사 | 종목 ID | 호재 1 | 호재 2 | 악재 1 | 악재 2 |', '|---|---|---|---|---|---|']
    for stock_id, name, business, events in companies:
        table.append(f'| [{name}](Energy/{stock_id}.md) | `{stock_id}` | ' + ' | '.join(e[1] for e in events) + ' |')
    path = Path('Docs/Rumors/README.md')
    text = path.read_text(encoding='utf-8')
    old = 'IT / 엔터 / 인프라·통신 / 바이오·제약 / 우주·항공 / 유통·소비재 6개 업종 각 9개 회사, 총 54개 회사·216개 사건·2,160개 단계별 본문 초안'
    new = 'IT / 엔터 / 인프라·통신 / 바이오·제약 / 우주·항공 / 유통·소비재 / 에너지·친환경 7개 업종 각 9개 회사, 총 63개 회사·252개 사건·2,520개 단계별 본문 초안'
    assert old in text and '## 에너지·친환경 회사별 원고' not in text
    text = text.replace(old, new)
    text = text.replace('## 다른 업종', '\n'.join(table) + '\n\n## 보존된 단독 원고')
    text = text.replace('기존 10단계 초안 한 건을 유지한다. 에너지 회사별 4개 원고 제작은 ⏳ 대기다.', '기존 10단계 초안을 보존한다. 브리즈파워 회사별 문서의 호재 ①과 같은 사건이며 위 총계에 중복 합산하지 않는다.')
    path.write_text(text, encoding='utf-8')
    print('에너지9개 회사·호재18개·악재18개·360개 본문 정리: 350개 신규 + 기존10개 유지')


if __name__ == '__main__':
    main()
