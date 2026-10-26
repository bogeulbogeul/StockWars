# 옷가게 게임 에셋 제거 — 2026-10-25

P1 (Major) · ✅ 웹·기존 로컬 실행본 반영·30개 테스트·양쪽 브라우저 검증 / ⏳ 사용자 최종 플레이 검수.

사용자 요청 “옷가게 에셋도 삭제해줘”에 따라 이전 의상 커스텀 폐기의 후속으로 옷가게 건물과 살롱 실내를 게임에서 제거했다. 이전에 시설·보니 대화를 유지한 기록보다 이번 범위가 우선한다.

- `assets/buildings/3d/ClothingStore-clean.glb`, `assets/interiors/salon/` 전체, `assets/effects/salon-makeover-v1/` 전체를 웹 및 기존 로컬 실행본에서 제거했다. 웹 기준 이미지·모델·프롬프트·메타데이터 103개, 97,983,140바이트다.
- 마을 3D/기존 2D 시설 목록·배치·크기·출입·상호작용에서 `claire_apparel`을 제거했다. 전용 진입로도 제거해 빈 출입점이나 보이지 않는 충돌을 남기지 않는다.
- 살롱 실내 모듈 생성·콜백·입력 차단 조건·CSS 로딩을 제거했다. 전용 실내 모듈/CSS와 옷가게 전용 브라우저 시연 페이지도 게임 경로에서 제거했다.
- 첫날 안내에서 옷가게 소개 장면과 장소 이동을 제외했다. 기존 원고 원본은 보존하며 실행 계획에서 해당 구간을 건너뛴다. 이전 전시 저장의 숫자 커서는 제거된 장면 수만큼 한 번 보정하며 자금·보유·진행 플래그는 유지한다.

제작 원본과 제거 파일은 `output/retired-clothing-store-2026-10-25/`에 보존했다. `asset-manifest.json`에 웹에서 제거한 103개 리소스 경로·크기·SHA-256이 있다. 소망이·집의 고정 옷장 가구·다른 시설·NPC 데이터·기존 보유/구매 기록은 삭제하지 않는다. 보니의 새 시설이나 역할을 임의로 만들지 않는다.

## 검증

- `node --test web/tests/clothingStoreRetirement.test.mjs web/tests/exhibition.test.mjs web/tests/townScale.test.mjs web/tests/townTopdown.test.mjs web/tests/townBoundary.test.mjs web/tests/officeRoomPackage.test.mjs`: 30개 통과.
- 신규 회귀 검증: 건물·진입로·소개 장면 제거, 포장/투자 양쪽 분기의 모든 기존 커서에 대한 후속 장면 보존, 중복 보정 방지.
- `scratch/check-clothing-retirement.cjs [web root]`: 웹과 기존 실행본 각각 마을 전체 초기화를 기다린 뒤 통과. 옷가게·살롱 UI 없음, 유효한 길 좌표, 보유 기록 보존, 페이지 오류 및 에셋 요청 실패 없음. 브라우저의 기본 favicon 404는 게임 에셋과 별개다.
- 실행 JS/CSS 라우터에서 삭제 건물·실내 import·콜백·CSS 참조 없음. 변경 파일 `git diff --check` 통과.

기존 `electron-app/dist/win-unpacked/resources/web/`를 갱신했으며 설치 프로그램은 재빌드하지 않았다.
