"""Condense current manuscripts only; preserve the deployed ten-stage runtime."""
from pathlib import Path
import re
import shutil

root = Path(__file__).resolve().parents[1]
base = root / 'Docs/Rumors'
archive = root / 'Docs/Archive/Rumors_TenStages_2026-10-25'
assert not archive.exists(), 'Already archived: do not overwrite the original ten-stage manuscripts.'
archive.mkdir(parents=True)
files = sorted(p for p in base.glob('*/*.md'))
assert len(files) == 72
special = base / 'BREEZEPOWER_SUPPLY_CONTRACT.md'
for path in files + [special, base / 'README.md']:
    destination = archive / path.relative_to(base)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)
shutil.copy2(root / 'Docs/RUMOR_AUTHORING_GUIDE.md', archive / 'RUMOR_AUTHORING_GUIDE.md')

selection = [0, 3, 5, 7, 9]
all_events = set()
labels = ['수수께끼·업종 단서·제약', '회사와 사건의 핵심 주장', '성사 조건과 현재 상태',
          '전언의 출처·적용 범위·대안', '확인 시점과 정보의 한계']
for path in files:
    text = path.read_text(encoding='utf-8')
    old = text
    def convert(match):
        body = match[0]
        event = re.search(r'사건 ID: `([^`]+)`', body)[1]
        assert event not in all_events
        all_events.add(event)
        stages = re.findall(r'^> (.+)$', body, re.M)
        assert len(stages) == 10
        prefix = body[:body.index('### 1단계')]
        return prefix + '\n\n'.join(f'### {i + 1}단계\n\n> {stages[index]}' for i, index in enumerate(selection)) + '\n\n'
    text = re.sub(r'^## (?:호재|악재) [12] .+\n[\s\S]*?(?=^## (?:호재|악재) [12] |\Z)', convert, text, flags=re.M)
    old_status = re.search(r'^\*\*2026-10-25.+?\*\*$', text, re.M)[0]
    text = text.replace(old_status, '**2026-10-25 · P1 (Major) · ✅ 완료: 호재 2개·악재 2개를 5단계 원고로 재구성 / ⏳ 대기: 5단계 게임 데이터·퀴즈 연결·사용자 최종 검수.**', 1)
    text = text.replace('10단계는 같은 원문을 끝까지 읽은 상태', '5단계는 같은 원문을 끝까지 읽은 상태')
    text = text.replace('신규 지급은 288종·10단계 원고를 사용한다.',
                        '현행 제작 원고는 288종·5단계다. 현재 게임은 기존 10단계 런타임을 사용하며 5단계 연결은 후속 작업이다.')
    text = text.replace('[게임 적용·검증 기록]', '[기존 10단계 게임 적용·검증 기록]')
    insertion = '\n[5단계 구성·검증·원본 보존 기록](../../RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md)\n'
    position = text.index('\n## 사건 목록')
    text = text[:position] + insertion + text[position:]
    stages = re.findall(r'^> (.+)$', text, re.M)
    assert len(stages) == 20
    original = re.findall(r'^> (.+)$', old, re.M)
    assert stages == [original[event * 10 + index] for event in range(4) for index in selection]
    assert not re.search(r'^### (?:6|7|8|9|10)단계', text, re.M)
    path.write_text(text, encoding='utf-8')
assert len(all_events) == 288

text = special.read_text(encoding='utf-8')
old_stages = re.findall(r'^> (.+)$', text, re.M)
assert len(old_stages) == 10
start, end = text.index('## 단계별 표시 본문'), text.index('## 단계별 해석 검수')
body = '## 단계별 표시 본문\n\n' + '\n\n'.join(f'### {i + 1}단계\n\n> {old_stages[index]}' for i, index in enumerate(selection))
text = text[:start] + body + '\n\n## 단계별 해석 검수\n\n'
text += '| 단계 | 공개 내용 | 확인할 추리 |\n|---|---|---|\n'
checks = ['큰 부탁과 현재 공급 능력을 구분한다.', '대상 회사와 계약 협의 상태를 파악한다.',
          '신규 설비의 가동 승인 심사를 확인한다.', '직원 전언과 다른 공급사 경쟁을 함께 읽는다.',
          '다음 주 선정 예정과 미확인 계약 금액을 구분한다.']
text += '\n'.join(f'| {i + 1} | {labels[i]} | {checks[i]} |' for i in range(5))
text += '\n\n5단계도 진위·매수 정답을 보장하지 않는다. 회사별 `R10_WINDHILL_P1`과 같은 사건이며 중복 집계하지 않는다. [5단계 구성·보존·반영 상태](../RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md)를 따른다.\n'
text = text.replace('계약설 10단계 원고', '계약설 5단계 원고').replace('✅ 완료: 10단계 원고 초안 작성', '✅ 완료: 5단계 원고 재구성')
special.write_text(text, encoding='utf-8')
assert re.findall(r'^> (.+)$', special.read_text(encoding='utf-8'), re.M) == re.findall(r'^> (.+)$', (base / 'Energy/WINDHILL.md').read_text(encoding='utf-8'), re.M)[:5]
print('Validated: 72 companies / 288 stable event IDs / 1440 stage texts; 5-stage full texts preserve old stage 10.')
