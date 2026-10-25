from pathlib import Path

root = Path(__file__).resolve().parents[1]
docs = root / 'Docs'
notice = '''
## 2026-10-25 최신 적용 — 찌라시·퀴즈 5단계

**P1 (Major) · ✅ 완료: 72개 회사·288개 사건의 1,440개 본문·864문항 웹·기존 실행본 리소스 적용·자동 검증 / ⏳ 대기: 사용자 최종 플레이 검수.** 분석력 Lv.1~5와 해석 1~5를 일대일로 연결하고 퀴즈는 1 / 2~3 / 4~5 중 해당 구간의 한 문항만 출제한다. 기존 가루 해석은 공개 정보를 보존하는 올림 대응으로 1회 이관하며 사건당 +1·한 번 지급·기존 보상 이력과 성장 20·30·40·60을 유지한다. 아래 10단계 런타임·5단계 연결 대기·분석력 두 배 해석 기록보다 우선한다. [적용·이관·검증](RUMOR_FIVE_STAGE_GAME_ROLLOUT_2026-10-25.md)을 따른다.
'''
for name in ['INDEX_GDD_00_MasterIndex.md', 'RUMOR_AUTHORING_GUIDE.md', 'MOD_GDD_18_QuizSystem.md',
             'CORE_GDD_03_PlayerGrowth.md', 'ANALYSIS_FIVE_LEVELS_2026-10-25.md',
             'RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md']:
    path = docs / name
    text = path.read_text(encoding='utf-8')
    heading, rest = text.split('\n', 1)
    path.write_text(heading + '\n' + notice + rest, encoding='utf-8')

for folder in ['Rumors', 'RumorQuizzes']:
    for path in (docs / folder).glob('*/*.md'):
        text = path.read_text(encoding='utf-8')
        text = text.replace('✅ 완료: 호재 2개·악재 2개를 5단계 원고로 재구성 / ⏳ 대기: 5단계 게임 데이터·퀴즈 연결·사용자 최종 검수.',
            '✅ 완료: 호재 2개·악재 2개 5단계 원고·게임 연결·자동 검증 / ⏳ 대기: 사용자 최종 플레이 검수.')
        text = text.replace('현재 게임은 기존 10단계 런타임을 사용하며 5단계 연결은 후속 작업이다.',
            '현재 게임도 5단계 원고를 사용하며 분석력과 일대일로 연결한다.')
        path.write_text(text, encoding='utf-8')
    path = docs / folder / 'README.md'
    text = path.read_text(encoding='utf-8')
    heading, rest = text.split('\n', 1)
    path.write_text(heading + '\n' + notice.replace('(RUMOR_FIVE_STAGE_GAME', '(../RUMOR_FIVE_STAGE_GAME') + rest, encoding='utf-8')

path = docs / 'RumorQuizzes/README.md'
text = path.read_text(encoding='utf-8').replace('1~3단계·4~6단계·7~10단계용', '1단계·2~3단계·4~5단계용')
text = text.replace('| 1~3 | 1 |', '| 1 | 1 |').replace('| 4~6 | 4 |', '| 2~3 | 2 |').replace('| 7~10 | 7 |', '| 4~5 | 4 |')
text = text.replace('기본 해석은 2·4·6·8·10단계', '기본 해석은 1·2·3·4·5단계')
path.write_text(text, encoding='utf-8')
path = docs / 'CORE_GDD_03_PlayerGrowth.md'
text = path.read_text(encoding='utf-8').replace('기본 해석은 Lv.1~5에 각각 2·4·6·8·10단계다.', '기본 해석은 Lv.1~5에 각각 1·2·3·4·5단계다.')
path.write_text(text, encoding='utf-8')
