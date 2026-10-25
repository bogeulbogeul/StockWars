# 건물 에셋 현황 — 2026-10-21

2026-10-25 서점 항공샷 후속: [지붕 교차부 정리 v3](../output/bookstore-roof-clean-v3/README.md)를 웹/기존 실행본에 반영했다. 지붕 외 메시·배치/배율/입구 정의는 유지했다. 새 지붕/기존 문창/간판/실측 폭·작은 화면·오류 검사 통과. 기존 실행본 충돌 표본은 수정 전 모델과 동일한 미차단 결과여서 별도 문제로 기록했다. 최종 시각/플레이 검수 대기.

2026-10-25 최신 외관 일괄 적용 후속: [현행 외관 9종](BUILDING_EXTERIOR_CURRENT_VERSIONS.md)을 웹·기존 로컬 실행본에 적용했다. 우체국을 집과 가구점 사이에 외관/충돌/진입로로 신규 배치했으며 우편 기능·실내는 별도다. 문 실측 배율·출입 기준점을 조정하고 양쪽 브라우저 검증·GLB 해시 일치를 확인했다. 아래 미적용/대기 기록보다 이번 적용을 우선한다. [적용 기록](../output/exterior-current-rollout-2026-10-25/README.md). ✅ 적용·자동 검증 / ⏳ 사용자 최종 시각·플레이 검수.

2026-10-25 이전 외관 사용 폐기: 사용자 요청으로 [현행 외관 9종 목록](BUILDING_EXTERIOR_CURRENT_VERSIONS.md)을 최신 제작본 기준으로 지정하고, 대체된 이전 버전은 사용 폐기한다. 재현에 필요한 원본·스크립트·과거 기록은 보존하며 자동 복원/폴백으로 사용하지 않는다. 이번 지정은 웹/실행본 모델 교체와 구분한다.

2026-10-25 펍 제작 후속: 사용자 채택 버건디 박공지붕·현관 박공·초승달·굴뚝·격자창 시안을 [재디자인 v2](../output/pub-redesign-v2/README.md)로 제작했다. 웹/기존 실행본의 `Pub-clean.glb`는 이번 제작에서 교체하지 않았다. 최종 시각 검수·게임 반영/검증은 대기다.

2026-10-25 은행 제작 후속: 사용자 채택 금빛 박공지붕·현관 박공·새싹 음각 동전·패널 양문을 [재디자인 v2](../output/bank-redesign-v2/README.md)로 제작했다. 웹/기존 실행본의 `Bank-clean.glb`는 이번 제작에서 교체하지 않았다. 최종 시각 검수·게임 반영/검증은 대기다.

2026-10-25 가구점 제작 후속: 사용자 채택 시안의 갈색 교차 박공지붕·기와/용마루·의자 간판·양문·쇼윈도를 [재디자인 v2](../output/furniture-redesign-v2/README.md)로 제작했다. 제작용 수정본이며 웹/기존 실행본의 `Furniture-clean.glb`는 이번 작업에서 교체하지 않았다. 최종 시각 검수와 게임 적용/검증은 대기다.

2026-10-25 안내소 최신: `Information-clean.glb`를 [재디자인 v2](../output/information-redesign-v2/README.md)의 초록 박공지붕·현관·문/창 디테일로 교체했다. 기존 새싹 마크·유리 재질·모아/실내 기능은 유지하며 웹/기존 실행본 로딩·배율·충돌·통로 검증을 따른다.

2026-10-25 최신 일괄 적용: 사용자 요청으로 집(오른쪽 우체통·문 배치 v4)·증권사(접합 v6)·잡화점(십자살 v8)·서점(지붕 v2)을 웹과 기존 실행본에 동기화했다. [최종 적용 목록·검증](../output/exterior-rollout-2026-10-25/README.md)을 따른다. 과거 집 미적용 기록보다 이번 적용이 우선한다. 집의 문 실측 배율과 출입 기준점을 새 모델에 맞췄다. ✅ 적용·양쪽 브라우저 검증 / ⏳ 최종 시각·플레이 검수.

2026-10-25 잡화점 문 마감 후속: [v5](../output/vivian-door-polish-v5/README.md)의 연속 패널/유리 몰딩과 황동 손잡이로 다듬었다. v4 폭·배율은 유지하며 웹/기존 실행본 반영·브라우저 검증을 통과했다.

2026-10-25 잡화점 폭 후속: [가로 확장 v4](../output/vivian-wide-v4/README.md)의 15% 넓어진 모델과 동일한 문 높이를 유지하는 배율을 웹/기존 실행본에 적용했다. 기존 v3의 디자인·위치는 유지하며 충돌·인접 건물 겹침 없음·로딩 검증을 통과했다.

2026-10-25 잡화점 최신: `VivianStore-clean.glb`를 [재디자인 v3](../output/vivian-redesign-v3/README.md)로 교체했다. 채택 시안의 코랄 박공지붕·꽃 간판·문/진열창 프레임·패널·목재 기둥을 반영했다. 웹/기존 실행본 동기화·로딩/배율/충돌/화면 검증 통과이며 시설 기능과 기존 배치는 유지한다.

2026-10-25 증권사 접합 후속: [계단·지붕·기둥 접지 v6](../output/cipher-joints-ground-v6/README.md)를 웹과 기존 실행본에 반영했다. 단일 세 단 계단·연속 박공 프레임·기둥 받침 12개 접지이며 문 v5와 배율·시계는 유지한다. 양쪽 브라우저 검증 통과.

2026-10-25 증권사 문 후속: 단층 확장형을 유지하며 [문 디테일 v5](../output/cipher-door-detail-v5/README.md)의 연속 아치·음각 패널·황동 손잡이로 교체했다. 웹/기존 실행본 동기화·시계/충돌/화면 검증 통과. 모델 경로와 게임 배율은 유지한다.

2026-10-25 최신 증권사: 사용자 채택 [단층 확장형 v4](../output/cipher-grand-single-v4/README.md)로 `CipherSecurities-clock.glb`를 교체한다. 기존 v2 외형보다 최신이며 실제 문 높이로 증권사 배율을 조정한다. 정확한 적용·검증 상태는 제작 기록을 따른다.

2026-10-25 증권사 후속: `CipherSecurities-clock.glb`를 [외관 마감 v2](../output/cipher-exterior-polish-v2/README.md)로 갱신했다. 파란 기와 박공지붕·연속 처마·창틀 접합을 정리하고 실시간 시계 연결은 유지했다. 웹·기존 로컬 실행본에 같은 모델을 반영했다.

2026-10-25 공통 완성도: 모든 건물의 후속 제작·수정·검수는 [서점 기준](ART_STYLE_GUIDE.md)의 실제 모델·지붕 접합부 마감을 따른다. 건물 고유 외형·색은 유지한다. ✅ 기준 지정 / ⏳ 다른 건물별 후속 수정·검수이며 이번 문서 반영으로 전체 모델의 검수 완료를 선언하지 않는다.

2026-10-25 서점 지붕 후속: `Bookstore-clean.glb`는 사용자 채택 박공지붕·직선 접합선 v2로 갱신한다. [제작·적용·검증 기록](../output/bookstore-roof-pitched-v2/README.md)을 따른다. 옷가게는 2026-10-25 폐기되어 현재 배포 건물은 8종이며 아래 9종 표는 과거 이력이다.

후속 폐기: 사용자 요청으로 기존 2D 건물 PNG도 웹·실행본에서 제거했다. [2D 마을 폐기 목록](Data/RETIRED_2D_TOWN_ASSETS_2026-10-21.json)을 따른다. 기존 2D PNG 보존 설명보다 이 후속이 우선하며 입구·충돌용 측정값만 유지한다.

사용자 요청으로 최신 외관 모델을 현행으로 확정하고 이전 게임 모델은 폐기한다. 런타임 목록은 `web/js/data/townModelBuildings.js`이며, 모델 경로는 `web/assets/buildings/3d/`다. 위치·크기·출입구 설정은 유지한다.

| 건물 | 현행 모델 | 폐기 모델 |
|---|---|---|
| 집 | Home-inset-window.glb | HomeBuilding.glb |
| 정착 안내소 | Information-clean.glb | InformationBuilding.glb |
| 비비안 잡화점 | VivianStore-clean.glb | StoreBuilding.glb |
| 모던 프레임 | Furniture-clean.glb | FunitueStoreBuilding.glb |
| 사이퍼 증권 | CipherSecurities-clock.glb | FinanceBuilding.glb |
| 노드 은행 | Bank-clean.glb | BankBuilding.glb |
| 미드나잇 펍 | Pub-clean.glb | PubBuilding.glb |
| 데이터 잉크 서점 | Bookstore-clean.glb | BookStoreBuilding.glb |
| 의상점 | ClothingStore-clean.glb | ClothingStore.glb |

집의 이전 중간 버전 `Home-native.glb`, `Home-original-clean.glb`, `Home-plain-wall.glb`, `Home-refined.glb`, `Home-sealed.glb`, `Home-single-eaves.glb`, `Home-window-clean.glb`도 게임 폴더에서 제거한다. 웹 및 로컬 실행본은 현행 9종만 보유한다. 이후 패키징은 정리된 `web/`을 사용한다.

`output/` 제작 원본·비교 이미지·작업 기록은 이력으로 보존한다. 폐기 모델은 자동 복원·신규 제작 참고로 사용하지 않는다. 과거 문서의 원본 보존 문구보다 이 폐기 결정을 우선한다. 2D 이전 화면의 좌표·크롭 데이터와 아직 코드에서 참조하는 PNG는 이번 GLB 정리와 구분해 유지한다. 실내 에셋·저장 데이터·시설 기능 개방은 변경하지 않는다.

**P1 (Major) · ✅ 최신 스타일 연결·구형 배포 GLB 폐기 / ⏳ 사용자 최종 시각·실제 플레이 접촉 검수.**

검증: 현행 9종의 GLB v2 헤더·파일 길이 및 웹/실행본 SHA-256 일치 확인. `scratch/check-bookstore-exterior.cjs`를 웹과 실행본 리소스 각각에 실행해 마을 로딩, 서점 메시·너비·충돌 판정, 작은 화면 표시 및 JavaScript 오류 없음 확인. 수동 플레이 접촉·전체 건물 사용자 시각 검수 완료를 뜻하지 않는다.
