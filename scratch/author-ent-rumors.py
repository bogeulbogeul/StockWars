from pathlib import Path
import re


def load_companies():
    companies = []
    for line in Path('scratch/ent-rumor-drafts.txt').read_text(encoding='utf-8').splitlines():
        if not line:
            continue
        if line.startswith('@'):
            stock_id, name, business = line[1:].split('|')
            companies.append((stock_id, name, business, []))
        else:
            fields = line.split('|')
            assert len(fields) == 12, (fields[1], len(fields))
            companies[-1][3].append((fields[0], fields[1], fields[2:]))
    assert len(companies) == 9
    return companies


def render_company(stock_id, name, business, events):
    assert [e[0] for e in events] == ['호재', '호재', '악재', '악재']
    lines = [f'# {name} 찌라시 원고', '',
        '**2026-10-25 · P1 (Major) · ✅ 완료: 호재 2개·악재 2개와 10단계 본문 초안 작성 / ⏳ 대기: 사용자 원고 검수·사건 연동 설계·게임 적용.**', '',
        f'종목 ID는 `{stock_id}`, 업종은 엔터/미디어(Entertainment)다. {business} 회사 기본 설정은 [현재 종목 데이터](../../../web/js/data/stocksData.js)를 따른다. 아래 사건은 이 설정을 바탕으로 신규 집필한 게임용 소문이며 실제로 발생한 시장 이벤트를 뜻하지 않는다.', '',
        '[전체 원고 목록](../README.md) · [작성 가이드](../../RUMOR_AUTHORING_GUIDE.md)', '',
        '## 사건 목록', '', '| 제작 구분 | 사건 ID | 플레이어 공통 제목 |', '|---|---|---|']
    for n, (direction, title, parts) in enumerate(events):
        slot = 'P' if direction == '호재' else 'N'
        lines.append(f'| {direction} {n % 2 + 1} | `R10_{stock_id}_{slot}{n % 2 + 1}` | {title} |')
    lines += ['', '## 표시와 사건 운영', '',
        '회사명·종목 ID·호재/악재·사건 ID는 제작용 메타데이터다. 낮은 단계 화면·검색·인벤토리 설명·알림에는 이를 정답으로 노출하지 않는다. 플레이어 제목은 각 사건의 공통 제목을 사용하고 본문은 해당 단계 한 개만 표시한다. 이 회사별 문서는 제작자용이며 그대로 플레이어에게 보여주지 않는다.', '',
        '호재와 악재는 주장 자체가 성사됐을 때의 사업상 방향이다. 진위·확정 수익률·매매 정답을 뜻하지 않는다. 각 사건은 독립된 발행 건으로 관리하고 서로의 단서를 합쳐 자동 사실로 확정하지 않는다. 10단계는 같은 원문을 끝까지 읽은 상태이며 전언의 진위를 보증하지 않는다.', '',
        '오늘·내일·사흘 뒤·이번 주말·다음 주·다음 달은 사건 발행 시점 기준이다. 개봉 전후의 상대 시점은 해당 사건의 예정 개봉일을 기준으로 한다. 실제 발행일·기한·만료·후속 무료 뉴스와 마을 단서·사건 결과·주가 반응·희귀도·가격·수급·퀴즈는 별도 설계한다. 기존 게임 25개 사건·5단계 본문·저장은 변경하지 않는다.', '']
    for n, (direction, title, p) in enumerate(events):
        slot = 'P' if direction == '호재' else 'N'
        event_id = f'R10_{stock_id}_{slot}{n % 2 + 1}'
        condition = p[2].split('. ')[-1]
        bodies = p[:3] + [p[3] + ' ' + condition] + [' '.join(p[3:i + 1]) for i in range(4, 10)]
        assert len(bodies) == len(set(bodies)) == 10
        lines += [f'## {direction} {n % 2 + 1} {title}', '', f'사건 ID: `{event_id}`', '',
            f'**주장:** {p[3]}', '', f'**근거:** {p[6]}', '',
            f'**남은 조건:** {p[4]} {p[5]}', '',
            f'**추가 정황·시점·한계:** {p[7]} {p[8]} {p[9]}', '']
        for stage, body in enumerate(bodies, 1):
            lines += [f'### {stage}단계', '', f'> {body}', '']
    lines += ['## 집필 검수 기준', '',
        '1~3단계는 비유·업종·이름 단서와 제약을 제공한다. 4단계에 회사와 사건, 5단계에 사업상 조건, 6단계에 현재 확인 상태, 7단계에 전언 출처, 8단계에 범위나 대안, 9단계에 확인 시점, 10단계에 원문이 밝히지 못하는 내용을 공개한다. 4~5단계는 앞서 드러난 제약을 유지하면서 비유를 구체적인 사건과 조건으로 풀고, 6~10단계는 앞 문장에 의미 있는 단서를 누적한다.', '',
        '무료 비교 자료는 사건별 주장과 남은 조건을 직접 확인할 수 있게 후속 집필한다. 해석 확인 퀴즈는 실제 표시된 본문으로 풀 수 있어야 하며 숨겨진 회사명·출처·시점을 정답으로 요구하지 않는다.', '']
    return '\n'.join(lines)


def main():
    companies = load_companies()
    folder = Path('Docs/Rumors/Entertainment')
    folder.mkdir(exist_ok=True)
    stocks = Path('web/js/data/stocksData.js').read_text(encoding='utf-8')
    expected = dict(re.findall(r"id: '([^']+)', name: '([^']+)', sector: 'Entertainment'", stocks))
    assert {c[0]: c[1] for c in companies} == expected
    for stock_id, name, business, events in companies:
        path = folder / f'{stock_id}.md'
        assert not path.exists(), path
        path.write_text(render_company(stock_id, name, business, events), encoding='utf-8')
    table = ['## 엔터 회사별 원고', '',
        '| 회사 | 종목 ID | 호재 1 | 호재 2 | 악재 1 | 악재 2 |', '|---|---|---|---|---|---|']
    for stock_id, name, business, events in companies:
        table.append(f'| [{name}](Entertainment/{stock_id}.md) | `{stock_id}` | ' + ' | '.join(e[1] for e in events) + ' |')
    p = Path('Docs/Rumors/README.md')
    s = p.read_text(encoding='utf-8')
    s = s.replace('IT 9개 회사·36개 사건·360개 단계별 본문 초안', 'IT·엔터 각 9개 회사, 총 18개 회사·72개 사건·720개 단계별 본문 초안')
    assert '## 엔터 회사별 원고' not in s
    s = s.replace('## 다른 업종', '\n'.join(table) + '\n\n## 다른 업종')
    p.write_text(s, encoding='utf-8')
    print('엔터 9개 회사·호재18개·악재18개·360개 본문 작성')


if __name__ == '__main__':
    main()
