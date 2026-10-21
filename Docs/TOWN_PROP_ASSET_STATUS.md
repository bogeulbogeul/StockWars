# 마을 장식 에셋 현황 — 2026-10-21

후속 폐기: 사용자 요청으로 이전 2D 마을 장식·바닥 PNG도 웹·실행본에서 제거했다. [2D 마을 폐기 목록](Data/RETIRED_2D_TOWN_ASSETS_2026-10-21.json)을 따른다. 아래 다른 2D PNG 보존 설명보다 이 후속이 우선하며 이동·상호작용용 좌표 데이터만 유지한다. 현행 3D 장식·코드 생성 바닥과 하늘은 유지한다.

장식은 최신 건물의 매끈한 무광 재질·부드러운 모서리에 맞춘 네이티브 3D 모델을 사용한다. 현행 배치는 `web/js/data/townModelProps.js`와 `townGardenProps.js`의 46곳이며 위치·크기·회전은 유지한다.

| 장식 | 현행 파일 (`web/assets/props/3d/`) | 폐기한 게임 파일 |
|---|---|---|
| 정류장 | BusStop-clean.glb | BusStop.glb |
| 포포리 나무 | Popori-refined.glb | BigTree.glb, BigTree-game.glb |
| 일반 나무 | CommonTree-clean.glb | Tree.glb |
| 작은 꽃 4색 | Flowers-mini-original.glb, Flowers-mini-pink.glb, Flowers-mini-lavender.glb, Flowers-mini-sky-blue.glb | Flower.glb |
| 벤치 | Bench-clean.glb | Bench.glb |
| 주민 게시판 | NoticeBoard-clean.glb | NoticeBoard.glb |
| 마을 전광판·광고판 | 폐기 | AdBoard.glb |

마을 전광판은 상점가·옷가게 옆 3D 광고판 2곳, 이전 2D 배치 및 상호작용 정의, 전광판 팝업, 방송 상태 콜백·타이머, 방송 모듈·전용 테스트·CSS를 제거했다. `web/assets/props/BillboardFrame.png`와 `topdown-v1/BillboardSimple.png` 및 해당 생성 메타데이터도 게임 폴더에서 제거했다. 벤치 CSS는 `town-benches.css`로 분리하고 건물 설명 모달은 독립 클래스명으로 유지한다. 주민 게시판과 증권사 실내 지수 화면은 이 폐기 대상이 아니다.

웹과 `electron-app/dist/win-unpacked/resources/web/`에 동일하게 반영했다. 이후 패키징은 정리된 `web/`을 사용한다. `output/` 제작 원본·비교 이미지·작업 기록은 이력으로 보존하며 폐기 모델을 새 제작 참고나 자동 복원 대상으로 사용하지 않는다. 이전 2D 화면에서 계속 참조하는 다른 PNG·좌표 데이터는 보존한다.

검증:

- `scratch/check-town-props.cjs`를 웹과 실행본에 각각 실행: 46개 장식 로딩·배치 너비·원본 재질, 꽃 4색, 주민 게시판 유지, 광고판·전광판 DOM·타이머 제거 확인. 작은 화면 표시 및 JavaScript 오류 없음 확인.
- 이동·출입·벤치·자판기·잡화점 복귀 관련 Node 테스트 18개 통과.
- 웹/실행본의 현행 장식 GLB 9개 SHA-256 일치 확인.

**P1 (Major) · ✅ 적용·폐기·자동 검증 / ⏳ 사용자 최종 시각·실제 플레이 접촉 검수.**
