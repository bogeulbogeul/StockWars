from pathlib import Path

root = Path(__file__).resolve().parents[1]
notice = '''
## 2026-10-25 최신 적용 — 분석력 최대 Lv.5·정답 150개

**P1 (Major) · ✅ 완료: 기획·웹·기존 실행본 리소스 적용·자동 검증 / ⏳ 대기: 사용자 최종 플레이 검수.** 분석력 최대 Lv.5, 승급 요구량 20·30·40·60, Lv.1 출발 누적 정답 150개로 조정했다. 기본 찌라시 해석은 2·4·6·8·10단계이며 864문항은 실제 표시 단계 구간별 하나만 출제한다. 사건당 숙련도 +1·한 번 지급과 기존 지급 이력을 유지하고, 구 성장량은 새 성장표로 1회 환산한다. 아래 최대 Lv.10·정답 110개 기록보다 이번 적용이 우선한다. [기획·저장 이관·검증](ANALYSIS_FIVE_LEVELS_2026-10-25.md)을 따른다.
'''
for name in ['CORE_GDD_03_PlayerGrowth.md', 'MOD_GDD_18_QuizSystem.md',
             'RUMOR_AUTHORING_GUIDE.md', 'INDEX_GDD_00_MasterIndex.md',
             'ANALYSIS_QUIZ_GAME_ROLLOUT_2026-10-25.md', 'AUTHORED_QUIZ_GAME_ROLLOUT_2026-10-25.md']:
    path = root / 'Docs' / name
    text = path.read_text(encoding='utf-8')
    heading, rest = text.split('\n', 1)
    path.write_text(heading + '\n' + notice + rest, encoding='utf-8')

path = root / 'Docs/CORE_GDD_03_PlayerGrowth.md'
text = path.read_text(encoding='utf-8')
start = text.index('### 분석력 숙련도 성장표')
end = text.index('\n## ', start) if '\n## ' in text[start:] else len(text)
text = text[:start] + '''### 분석력 숙련도 성장표

**2026-10-25 후속 조정 · P1 (Major) · ✅ 완료: 최대 Lv.5·20·30·40·60 성장표 및 게임 적용 / ⏳ 대기: 사용자 최종 플레이 검수.**

| 성장 구간 | 추가 숙련도 | Lv.1 출발 누적 정답 사건 |
|---|---:|---:|
| Lv.1 → Lv.2 | 20 | 20 |
| Lv.2 → Lv.3 | 30 | 50 |
| Lv.3 → Lv.4 | 40 | 90 |
| Lv.4 → Lv.5 | 60 | 150 |

정답 숙련도 +1·플레이어별 사건당 한 번 지급·오답 후 재도전 동일 보상을 유지한다. 승급 요구량을 차감하고 남은 숙련도는 다음 레벨에 보존한다. 최대 Lv.5에서는 초과 숙련도·대체 보상을 지급하지 않는다. 캐릭터 EXP와는 별개다.

시작 테스트의 기존 배점은 유지한다. Lv.1 출발은 정답 150개, Lv.2는 130개, Lv.3은 100개가 더 필요하다. 출발 숙련도는 0이며 시작 레벨을 정답 사건으로 만들어 지급 이력을 채우지 않는다.

기본 해석은 Lv.1~5에 각각 2·4·6·8·10단계다. 가루로 저장한 개별 해석 단계가 더 높으면 유지한다. 같은 사건의 사본·단계 상승·가루·재접속은 새 보상이 아니다. 구 version 1은 예전 레벨까지의 누적 요구량과 현재 숙련도를 합쳐 새 표에 1회 재배분하고, 모든 지급 이력은 그대로 보존한다. 구 Lv.10은 새 Lv.4·20/60으로 옮긴다. [상세 이관·검증](ANALYSIS_FIVE_LEVELS_2026-10-25.md)을 따른다.
''' + text[end:]
text = text.replace('분석력만 남기고 Lv.1~10', '분석력만 남기고 Lv.1~5')
text = text.replace('찌라시의 기본 표시 해석 1~10단계', '찌라시의 기본 표시 해석 2·4·6·8·10단계')
path.write_text(text, encoding='utf-8')

path = root / 'Docs/RumorQuizzes/README.md'
text = path.read_text(encoding='utf-8').replace('분석력 성장 요구량은 6·10·16·20이며 1→10단계는 정답 110개다.',
    '분석력은 최대 Lv.5, 성장 요구량은 20·30·40·60이며 Lv.1→5는 정답 150개다. 기본 해석은 2·4·6·8·10단계이며 가루로 더 높게 해석한 개별 원고는 유지한다. 기존 보상 이력을 보존하는 성장 이관은 [최신 적용 기록](../ANALYSIS_FIVE_LEVELS_2026-10-25.md)을 따른다.')
path.write_text(text, encoding='utf-8')

path = root / 'Docs/MOD_GDD_18_QuizSystem.md'
text = path.read_text(encoding='utf-8').replace('Lv.1→10은 서로 다른 사건 정답 110개이며',
    'Lv.1→5는 서로 다른 사건 정답 150개이며')
path.write_text(text, encoding='utf-8')
print('Updated current growth table, quiz guide, manuscript guide, index and rollout precedence notices.')
