from pathlib import Path

root = Path(__file__).resolve().parents[1]
docs = root / 'Docs'
index = docs / 'Rumors/README.md'
(docs / 'Archive/Rumors_TenStages_2026-10-25/INDEX_AT_ARCHIVE.md').write_text(index.read_text(encoding='utf-8'), encoding='utf-8')
text = index.read_text(encoding='utf-8')
heading, rest = text.split('\n', 1)
notice = '''
## 2026-10-25 현행 제작 원고 — 5단계

**P1 (Major) · ✅ 완료: 72개 회사·288개 사건·1,440개 본문을 5단계로 재구성 / ⏳ 대기: 5단계 게임 데이터·퀴즈 연결·사용자 최종 검수.** 1단계 수수께끼·제약 → 2단계 회사·사건 → 3단계 조건·현재 상태 → 4단계 출처·범위·대안 → 5단계 시점·정보의 한계로 구성한다. 아래 10단계 게임 적용 기록은 현재 실행본 이력이며 현행 제작 원고의 단계 수와 구분한다. [재구성·검증·보존 기록](../RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md) · [이전 10단계 보관본](../Archive/Rumors_TenStages_2026-10-25/README.md).
'''
index.write_text(heading + '\n' + notice + rest, encoding='utf-8')

guide = docs / 'RUMOR_AUTHORING_GUIDE.md'
text = guide.read_text(encoding='utf-8')
heading, rest = text.split('\n', 1)
notice = '''
## 2026-10-25 최신 원고 기준 — 해석 5단계

**P1 (Major) · ✅ 완료: 회사별 288개 사건의 5단계 원고 재구성 / ⏳ 대기: 게임 데이터·퀴즈 연결·사용자 최종 검수.** 분석력은 최대 Lv.5, 찌라시 신규 제작 원고도 5단계다. 기존 10단계 작성 규칙보다 이번 구성이 우선한다. 현재 게임의 해석 2·4·6·8·10 연결과 864문항은 아직 이전 적용본이므로 원고 변경과 런타임 완료를 구분한다. [재구성·보존·후속 범위](RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md)를 따른다.

| 단계 | 공개 내용 | 작성 기준 |
|---|---|---|
| 1 | 수수께끼·업종 단서·제약 | 읽을 수 있는 비유와 조건을 남기고 회사명은 숨긴다. |
| 2 | 회사·사건의 주장 | 회사명과 구체 사건을 밝히며 확정되지 않은 상태를 유지한다. |
| 3 | 성사 조건·현재 상태 | 검증·허가·합의와 진행 중·미확정 결과를 구분한다. |
| 4 | 출처·범위·대안 | 관계자 전언의 한계와 적용 범위·경쟁·대응 정황을 포함한다. |
| 5 | 확인 시점·정보의 한계 | 원문 전체와 남은 확인 시점·미확인 항목을 밝힌다. |

각 단계는 같은 사건의 본문 하나이며, 높은 단계에서도 진위·수익·매매 정답을 보장하지 않는다. 제목·사건 ID·호재/악재·제작 메타데이터를 바꾸지 않는다. `R10_` 식별자도 저장·지급 이력 연결을 위해 유지한다. 성장 요구량 20·30·40·60과 사건당 +1·한 번 지급은 유지한다. 퀴즈의 1 / 2~3 / 4~5 구간 재연결과 가루·저장 이관은 후속 게임 작업이며 이번에 자동 적용하지 않았다.

### 5단계 예시 — 브리즈파워

1. 바람·날개의 비유와 부족한 공급 능력을 읽는다.
2. 브리즈파워와 공동시설 전력 공급 협의를 파악한다.
3. 신규 설비와 심사 중인 가동 승인을 확인한다.
4. 설비 업체 직원의 전언과 다른 공급사 경쟁을 구분한다.
5. 다음 주 선정 예정과 미확인 계약 금액까지 읽는다.

[실제 단계별 원고](Rumors/BREEZEPOWER_SUPPLY_CONTRACT.md)를 따른다. 아래 10단계 예시·규칙은 이전 기획·게임 적용 이력으로 보존한다.
'''
text = heading + '\n' + notice + rest
text = text.replace('### 10단계 구성 예시 —', '### 이전 10단계 구성 예시 —')
text = text.replace('## 해석 1~10단계 —', '## 이전 해석 1~10단계 —')
guide.write_text(text, encoding='utf-8')

path = docs / 'INDEX_GDD_00_MasterIndex.md'
text = path.read_text(encoding='utf-8')
heading, rest = text.split('\n', 1)
path.write_text(heading + '''

## 2026-10-25 찌라시 원고 5단계 재구성

**P1 (Major) · ✅ 완료: 72개 회사·288개 사건·1,440개 본문 및 브리즈파워 예시 재구성 / ⏳ 대기: 5단계 게임 데이터·퀴즈 연결·사용자 최종 검수.** [현행 원고 목록](Rumors/README.md) · [작성 기준](RUMOR_AUTHORING_GUIDE.md) · [검증·이전 원고 보존·후속 범위](RUMOR_FIVE_STAGE_MANUSCRIPTS_2026-10-25.md). 분석력 성장량·기존 게임 런타임·864문항·보상 이력은 이번 원고 작업에서 변경하지 않았다.
''' + rest, encoding='utf-8')

path = docs / 'Archive/Rumors_TenStages_2026-10-25/README.md'
text = path.read_text(encoding='utf-8').replace('당시 인덱스 `README.md`의 별도 보존본', '당시 인덱스 `INDEX_AT_ARCHIVE.md`')
path.write_text(text, encoding='utf-8')
