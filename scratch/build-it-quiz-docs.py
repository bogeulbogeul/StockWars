from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
destination = root / 'Docs/RumorQuizzes/IT'
destination.mkdir(parents=True, exist_ok=True)
entries = {}
for line in (root / 'scratch/it-quiz-manuscripts.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('@'):
        company = line[1:]
        entries[company] = []
    elif line.strip():
        fields = line.split('|')
        assert len(fields) == 7, line
        entries[company].append(fields)

bands = {'L': (1, '1~3'), 'M': (4, '4~6'), 'H': (7, '7~10')}
symbols = ['①', '②', '③']
questions = set()
roster = []
total = 0
for company_index, (company, rows) in enumerate(entries.items()):
    source = (root / f'Docs/Rumors/IT/{company}.md').read_text(encoding='utf-8')
    name = source.splitlines()[0].removeprefix('# ').removesuffix(' 찌라시 원고')
    parts = re.split(r'^## (호재|악재) ([12]) (.+)\n', source, flags=re.M)
    events = {}
    for offset in range(1, len(parts), 4):
        kind, number, title, body = parts[offset:offset + 4]
        key = ('P' if kind == '호재' else 'N') + number
        event_id = re.search(r'^사건 ID: `([^`]+)`', body, re.M)[1]
        stages = re.findall(r'^> (.+)$', body, re.M)
        assert len(stages) == 10
        events[key] = (title, event_id, stages)
    assert len(rows) == 12 and len(events) == 4
    assert {(r[0], r[1]) for r in rows} == {(e, b) for e in events for b in bands}
    lines = [f'# {name} 찌라시 해석 확인 문항', '',
             '**2026-10-25 · P1 (Major) · ✅ 완료: 4개 사건·12개 문항 원고 작성 / ⏳ 대기: 사용자 검토·수동 문항의 게임 연결.**', '',
             f'[회사별 원문](../../Rumors/IT/{company}.md) · [문항 목록·운영 규칙](../README.md) · [퀴즈 기획](../../MOD_GDD_18_QuizSystem.md)', '',
             '제작자용 문서다. 정답·해설·사건 ID·회사명은 퀴즈 시작 전에 플레이어에게 노출하지 않는다. 각 단계 구간에서 한 문항만 출제하며 세 문항을 연속으로 요구하지 않는다. 정답 숙련도 +1은 사건당 한 번만 지급한다.', '']
    for event_index, (key, (title, event_id, stages)) in enumerate(events.items()):
        lines += [f'## {title}', '', f'사건 ID: `{event_id}`', '']
        for band_index, band in enumerate(bands):
            row = next(r for r in rows if r[:2] == [key, band])
            _, _, question, correct, wrong_a, wrong_b, explanation = row
            assert question not in questions
            questions.add(question)
            assert len({correct, wrong_a, wrong_b}) == 3
            level, label = bands[band]
            if band == 'L':
                assert name not in '|'.join(row[2:])
            evidence = stages[level - 1]
            if band == 'H':
                evidence = evidence.split('. ')[-1]
                assert '전언' in evidence or '나왔대' in evidence
            answer_index = (event_index + band_index + company_index) % 3
            choices = [wrong_a, wrong_b]
            choices.insert(answer_index, correct)
            lines += [f'### {label}단계 문항', '', f'문항 ID: `Q10_{company}_{key}_{band}` · 최소 공개 단계: {level}', '',
                      question, '']
            lines += [f'{i + 1}. {choice}' for i, choice in enumerate(choices)]
            lines += ['', f'**정답: {symbols[answer_index]}**', '', f'**해설:** {explanation}', '',
                      f'**출제 근거 — {level}단계:**', '', f'> {evidence}', '']
            total += 1
    output = '\n'.join(lines)
    assert not re.search(r'[\u3040-\u30ff\u4e00-\u9fff]', output)
    (destination / f'{company}.md').write_text(output, encoding='utf-8')
    roster.append(f'| [{name}](IT/{company}.md) | `{company}` | 4 | 12 |')

assert len(entries) == 9 and total == 108
index = '''# 찌라시 해석 확인 문항 목록

**2026-10-25 · P1 (Major) · ✅ 완료: IT 9개 회사·36개 사건·108개 문항 원고 작성 / ⏳ 대기: 사용자 검토·수동 문항의 게임 연결·다른 업종 집필.**

[찌라시 원고 목록](../Rumors/README.md) · [퀴즈 기획](../MOD_GDD_18_QuizSystem.md) · [작성 가이드](../RUMOR_AUTHORING_GUIDE.md)

## 출제 기준

사건마다 1~3단계·4~6단계·7~10단계용 문항을 하나씩 준비한다. 현재 공개 단계에 맞는 한 문항만 출제한다. 세 변형은 별도 보상 사건이 아니다.

| 공개 단계 | 최소 근거 단계 | 확인할 해석 |
|---|---|---|
| 1~3 | 1 | 비유의 의미와 남은 조건을 연결한다. 회사명을 맞히게 하지 않는다. |
| 4~6 | 4 | 사업 내용·관찰된 사실·검증과 계약의 남은 조건을 구분한다. |
| 7~10 | 7 | 출처의 관계와 한계를 읽고 전언을 최종 결정으로 확대하지 않는다. |

각 문항은 질문·보기 3개·정답 1개·해설·원문 근거를 갖는다. 구간의 첫 단계 본문만으로 답할 수 있도록 작성했으며 이후 단계 정보는 정답 전제에 사용하지 않는다. 정답 위치는 회사별·사건별로 순환한다. 회사별 문서는 제작자용이며 정답·해설과 원문 근거를 문제 화면에 미리 보여주지 않는다.

정답 숙련도 +1, 오답 후 재도전도 동일 보상, 플레이어별 사건 ID당 한 번 지급을 유지한다. 복사본·재열람·단계 상승·문항 교체로 지급 이력을 초기화하지 않는다. 분석력 성장 요구량은 6·10·16·20이며 1→10단계는 정답 110개다.

현재 게임은 기존 자동 구성 문항을 사용한다. 이 목록은 새 수동 문항 원고이며 게임 데이터·출제 로직·저장 형식은 이번 집필로 변경하지 않았다. 연결 시 기존 사건별 보상 이력을 그대로 유지해야 한다.

## IT 회사별 문항

| 회사 | 종목 ID | 사건 수 | 문항 수 |
|---|---|---|---|
'''
(destination.parent / 'README.md').write_text(index + '\n'.join(roster) + '\n', encoding='utf-8')
print(f'Validated: {len(entries)} companies, 36 events, {total} unique questions, 324 choices; source stages 1/4/7.')
