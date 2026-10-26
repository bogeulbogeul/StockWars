# 의상 커스텀 UI·기능 제거 — 2026-10-25

P1 (Major) · ✅ 웹·기존 로컬 실행본 반영·관련 테스트 및 브라우저 검증 / ⏳ 사용자 최종 플레이 검수.

사용자 요청 “게임에 남아 있는 옷장이나 의상 커스텀 관련 UI와 기능도 정리해줘”에 따라 다음을 제거했다.

- 집의 옷장 상호작용 지점, 앱의 옷장 콜백·모달 생성, 옷장 CSS 로딩.
- 가방의 의상 착용·해제 처리. 기존 의상 데이터는 삭제하지 않고 일반·선물 목록에서 제외한다. 상세 화면과 직접 사용 경로에서도 의상 동작을 차단한다.
- 등록 화면의 동물 캐릭터 선택 버튼·선택 이벤트. 닉네임·후속 등록 과정과 기존 프로필 저장 필드 계약은 유지한다.
- 살롱의 스타일 상품 미리보기·변신 연출 및 관련 CSS 로딩. 보니의 인사, 실내 이동·좌석·출구는 유지하고 시설 설명에서 외형 선택 안내를 제거한다.

집의 고정 옷장 그림·가구 데이터·충돌, 살롱 건물과 고유 이름, NPC 고정 의상, 소망이 표정, 기존 보유/구매/프로필 저장과 제작 원본은 보존한다. 전시 원고의 ‘보니 옷장’은 기존 가게 고유 이름이며 캐릭터 옷장 기능 진입점이 아니다.

옷장·살롱 스타일 UI/연출의 JS 4개와 CSS 2개는 `output/retired-clothing-customization-2026-10-25/`로 옮겨 게임 소스에서 제거했다. 과거 스타일 데이터·스프라이트 호환 렌더 모듈을 신규 기능으로 재연결하지 않는다. 가방 상세 화면은 `web/js/components/inventory/InventoryDetail.js`로 분리해 `InventoryModal.js`를 458줄에서 378줄로 줄였다.

## 검증

- `node --test web/tests/officeRoomPackage.test.mjs web/tests/salonRoomPackage.test.mjs web/tests/exhibition.test.mjs web/tests/itemEngine.test.mjs web/tests/vivianCatalog.test.mjs`: 37개 통과. 집·살롱 이동/충돌·출구, 전시 진행, 상품 사용·보유 호환 검증.
- `scratch/check-clothing-retirement.cjs [web root]`: 웹과 기존 실행본 각각 통과. 옷장 모달/집 진입점 없음, 등록 선택 버튼 없음, 옛 의상 목록·상세·사용 차단 및 데이터 보존, 살롱 대화 유지·스타일/변신 UI 없음, 페이지 오류 및 에셋 요청 실패 없음.
- 변경 JS 문법 검사 통과. 새 코드 파일과 수정 대상은 500줄 이내, CSS 라우터는 50줄 이내.

기존 로컬 실행본의 `electron-app/dist/win-unpacked/resources/web/`에도 동일 변경을 반영했다. 설치 프로그램 재빌드·배포는 수행하지 않았다.
