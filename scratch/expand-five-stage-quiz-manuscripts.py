"""Expand the authored three-question bank to distinct questions at every stage."""
from pathlib import Path
import re
import shutil

root = Path(__file__).resolve().parents[1]
base = root / 'Docs/RumorQuizzes'
archive = root / 'Docs/Archive/RumorQuizzes_ThreeBands_2026-10-25'
assert not archive.exists(), 'Preserve the original bank; do not run this conversion twice.'
files = sorted(base.glob('*/*.md'))
assert len(files) == 72
breeze = {
    1: ('큰 부탁을 받으려는 ‘바람을 모으는 집’의 상황은 무엇일까요?',
        ['부탁이 들어오면 지금 날개로 충분히 감당할 수 있어요.', '기회가 있지만, 감당하려면 새 날개가 필요해요.', '새 날개만 펼치면 큰 부탁을 받는 것이 보장돼요.'], 1,
        '기회가 생길 가능성과 이를 감당할 능력은 별개예요.'),
    2: ('본문이 전하는 브리즈파워의 현재 상황은 무엇인가요?',
        ['공동시설 전력 공급 계약을 협의하고 있어요.', '공동시설 전력 공급 계약을 이미 체결했어요.', '공동시설에 약속한 전력을 모두 공급했어요.'], 0,
        '협의 중은 계약 체결이나 공급 완료를 뜻하지 않아요.'),
    3: ('공급 능력을 판단하려면 다음 중 무엇을 확인해야 할까요?',
        ['공동시설이 이미 전력을 얼마나 사용했는지 확인해요.', '계약을 협의하므로 신규 설비도 승인됐다고 봐요.', '심사 중인 신규 발전 설비의 가동 승인 여부를 확인해요.'], 2,
        '기존 설비로는 물량이 부족하고, 필요한 신규 설비의 가동 승인은 아직 심사 중이에요.'),
    4: ('설비 업체 직원의 말대로 신규 설비가 승인되면 계약 선정도 확정될까요?',
        ['설비 직원이 전했으므로 구매처의 선정 발표와 같아요.', '구매처가 다른 공급사와도 협의하므로 선정은 별도로 확인해야 해요.', '다른 공급사도 있으므로 브리즈파워의 탈락이 확정됐어요.'], 1,
        '직원의 전언은 공식 발표가 아니며, 설비 승인과 경쟁에서의 선정은 서로 다른 조건이에요.'),
    5: ('다음 주 브리즈파워의 최종 선정 소식이 나오면, 그것만으로 계약 수익 규모도 알 수 있을까요?',
        ['계약 금액과 비용 조건을 더 확인해야 해요.', '선정되면 계약 금액과 이익도 자동으로 확정돼요.', '계약 금액이 아직 없으므로 선정 소식도 의미가 없어요.'], 0,
        '선정 여부는 중요한 확인 정보지만 현재 원고에는 계약 금액이 없어요. 금액이 공개돼도 비용까지 알아야 남는 이익을 판단할 수 있어요.')
}
questions = set()
for company_index, path in enumerate(files):
    old = path.read_text(encoding='utf-8')
    saved = archive / path.relative_to(base)
    saved.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, saved)
    source = (root / 'Docs/Rumors' / path.relative_to(base)).read_text(encoding='utf-8')
    source_parts = re.split(r'^## (?:호재|악재) [12] .+\n', source, flags=re.M)[1:]
    stages_by_id = {re.search(r'사건 ID: `([^`]+)`', p)[1]: re.findall(r'^> (.+)$', p, re.M) for p in source_parts}
    pieces = re.split(r'^## (.+)\n\n사건 ID: `([^`]+)`\n', old, flags=re.M)
    head = pieces[0].replace('4개 사건·12개 문항', '4개 사건·20개 문항')
    head = head.replace('각 단계 구간에서 한 문항만 출제하며 세 문항을 연속으로 요구하지 않는다.',
                        '각 해석 단계에서 서로 다른 한 문항만 출제하며 다섯 문항을 연속으로 요구하지 않는다.')
    output = head
    for offset in range(1, len(pieces), 3):
        title, event_id, body = pieces[offset:offset + 3]
        stages = stages_by_id[event_id]
        assert len(stages) == 5
        existing = {}
        for block in re.split(r'^### ', body, flags=re.M)[1:]:
            level = int(block[0])
            q = re.search(r'최소 공개 단계: \d+\n\n(.+?)\n\n1\. ', block, re.S)[1]
            choices = re.findall(r'^[123]\. (.+)$', block, re.M)
            correct = '①②③'.index(re.search(r'\*\*정답: ([①②③])', block)[1])
            explanation = re.search(r'^\*\*해설:\*\* (.+)$', block, re.M)[1]
            question_id = re.search(r'문항 ID: `([^`]+)`', block)[1]
            existing[level] = (q, choices, correct, explanation, question_id)
        assert set(existing) == {1, 2, 4}
        output += f'## {title}\n\n사건 ID: `{event_id}`\n\n'
        for level in range(1, 6):
            if level in existing:
                q, choices, correct, explanation, question_id = existing[level]
            else:
                question_id = f'Q5_{event_id}_{level}'
                if level == 3:
                    details = stages[2].split('. ', 1)[1]
                    q = f'「{title}」에서 확인할 조건과 현재 진행 상태를 함께 읽은 것은 무엇인가요?'
                    correct_text = details
                    choices = ['본문의 확인 과제는 이미 모두 끝났고, 미확정 결과도 확정됐어요.',
                               '진행 중인 확인이 있으므로 이 사건 전체가 실패한 것으로 판정됐어요.']
                    explanation = f'본문은 “{details}”라고 구분해요. 확인 조건과 현재 상태를 완료·성공이나 전체 실패로 바꾸지 않아요.'
                else:
                    details = '. '.join(stages[4].split('. ')[-2:])
                    q = f'「{title}」의 확인 일정과 아직 모르는 정보를 어떻게 구분해야 할까요?'
                    correct_text = details
                    choices = ['예정된 확인 시점이 있으므로 아직 모르는 수치와 최종 결과도 확정됐어요.',
                               '미확인 정보가 남았으므로 예정된 확인과 추가 자료는 살필 필요 없어요.']
                    explanation = f'본문의 마지막 단서는 “{details}”예요. 확인 일정은 결과 보증이 아니며 미확인 정보는 이후 자료로 확인해야 해요.'
                correct = (company_index + offset + level) % 3
                choices.insert(correct, correct_text)
            if event_id == 'R10_WINDHILL_P1':
                q, choices, correct, explanation = breeze[level]
            assert q not in questions
            questions.add(q)
            assert len(choices) == len(set(choices)) == 3
            output += f'### {level}단계 문항\n\n문항 ID: `{question_id}` · 최소 공개 단계: {level}\n\n{q}\n\n'
            output += '\n'.join(f'{i + 1}. {choice}' for i, choice in enumerate(choices))
            output += f'\n\n**정답: {"①②③"[correct]}**\n\n**해설:** {explanation}\n\n**출제 근거 — {level}단계:**\n\n> {stages[level - 1]}\n\n'
    path.write_text(output.rstrip() + '\n', encoding='utf-8')
assert len(questions) == 1440
shutil.copy2(base / 'README.md', archive / 'INDEX_AT_ARCHIVE.md')
print('Authored 1440 distinct questions / 288 events / 72 companies; preserved 3-band manuscripts.')
