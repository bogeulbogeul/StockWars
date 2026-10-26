from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
docs = root / 'Docs'
notice = '''
## 2026-10-25 최신 적용 — 해석 단계별 퀴즈 1,440문항

**P1 (Major) · ✅ 완료: 72개 회사·288개 사건의 단계별 서로 다른 1,440문항 원고·웹·기존 실행본 리소스 적용·자동 검증 / ⏳ 대기: 사용자 최종 플레이 검수.** 각 사건의 1~5단계마다 다른 문항을 준비하고 실제 표시 단계의 한 문항만 출제한다. 사건당 +1·한 번 지급·기존 보상 이력·성장 20·30·40·60과 가루 해석 진도는 유지한다. 아래 864문항·2~3 및 4~5 공통 구간 출제 기록보다 우선한다. [적용·저장 호환·검증](QUIZ_PER_STAGE_GAME_ROLLOUT_2026-10-25.md)을 따른다.
'''
for name in ['INDEX_GDD_00_MasterIndex.md', 'MOD_GDD_18_QuizSystem.md', 'RUMOR_AUTHORING_GUIDE.md',
             'RUMOR_FIVE_STAGE_GAME_ROLLOUT_2026-10-25.md']:
    path = docs / name
    text = path.read_text(encoding='utf-8')
    heading, rest = text.split('\n', 1)
    path.write_text(heading + '\n' + notice + rest, encoding='utf-8')

path = docs / 'RumorQuizzes/README.md'
text = path.read_text(encoding='utf-8')
start, end = text.index('## 출제 기준'), text.index('## IT 회사별 문항')
text = text[:start] + '''## 출제 기준

사건마다 해석 1~5단계별로 서로 다른 문항을 하나씩 준비한다. 실제 표시 단계에 맞는 한 문항만 출제하며 다섯 문제를 연속으로 요구하지 않는다. 문항이 바뀌어도 사건당 보상은 한 번이다.

| 해석 단계 | 확인할 해석 |
|---|---|
| 1 | 비유의 의미와 남은 제약 |
| 2 | 회사·사건의 핵심 주장과 확인 과제 |
| 3 | 성사 조건·현재 진행 상태의 구분 |
| 4 | 출처의 관계·범위·경쟁·대안 |
| 5 | 확인 시점·아직 모르는 정보 |

회사마다 4개 사건·20문항, 전체 72개 회사·288개 사건·1,440문항이다. 질문·보기 3개·정답·해설·해당 단계 본문 근거를 기록한다. 제작자용 정답과 해설은 문제 시작 전에 미리 노출하지 않는다. 기본 해석은 분석력 Lv.1~5와 일대일이며 개별 가루 해석이 더 높으면 실제 표시 단계의 문제를 사용한다.

정답 숙련도 +1·오답 후 재도전 동일 보상·플레이어별 사건당 한 번 지급을 유지한다. 사본·가루·단계 변경·재접속으로 지급 이력을 초기화하지 않는다. 성장 요구량은 20·30·40·60, Lv.1 출발 정답 150개다. [실제 적용·저장 호환·검증](../QUIZ_PER_STAGE_GAME_ROLLOUT_2026-10-25.md)을 따른다.

''' + text[end:]
heading, rest = text.split('\n', 1)
text = heading + '\n' + notice.replace('(QUIZ_PER', '(../QUIZ_PER') + rest
text = text.replace('| 4 | 12 |', '| 4 | 20 |')
path.write_text(text, encoding='utf-8')

path = docs / 'Rumors/README.md'
text = path.read_text(encoding='utf-8')
heading, rest = text.split('\n', 1)
path.write_text(heading + '\n' + notice.replace('(QUIZ_PER', '(../QUIZ_PER') + rest, encoding='utf-8')

archive = docs / 'Archive/RumorQuizzes_ThreeBands_2026-10-25/README.md'
archive.write_text('# 3구간 퀴즈 원고 보관본\n\n2026-10-25 단계별 5문항으로 확장하기 전의 회사별 864문항과 당시 인덱스를 보관한다. 현재 제작·게임 기준은 [단계별 문항 적용 기록](../../QUIZ_PER_STAGE_GAME_ROLLOUT_2026-10-25.md)을 따른다. 보관 문서의 상대 링크와 상태는 당시 위치·시점의 이력이다.\n', encoding='utf-8')
