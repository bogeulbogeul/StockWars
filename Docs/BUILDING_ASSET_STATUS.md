# 건물 에셋 현황 — 2026-10-21

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
