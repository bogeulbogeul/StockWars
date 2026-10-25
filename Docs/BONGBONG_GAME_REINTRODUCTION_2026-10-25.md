# 봉봉 게임 재적용 — 2026-10-25

사용자 요청 “좋아. 봉봉도 게임에 적용해줘.”에 따라 채택한 [꽃봉오리 v5](../output/bongbong-bud-reference-v5/README.md)의 살구색 몸·코랄 꽃봉오리·기본 미소 모델을 적용했다.

P1 (Major) · ✅ 웹/기존 실행본 리소스 반영·브라우저 검사 / ⏳ 사용자 최종 외형·플레이 검수.

- `web/assets/characters/3d/bongbong/bongbong.glb`: 채택 GLB 그대로 설치. 몸체는 소망이 기준이며 앞치마·의상·음식은 없다.
- `VivianShopkeeper.js`: 일반 모드와 첫날 전시가 공유하는 잡화점 계산대 뒤에 봉봉을 배치했다. 원본 몸 높이 100 월드 단위, 머리장식 높이는 별도 추가된다. 본·재질은 공통 캐시에서 독립 복제하며 정지 자세를 사용한다.
- `vivianModelRoom.js`: 봉봉 중심 (0, -157.5), 충돌 반경 28에 기존 플레이어 반경을 합산한다. 기존 계산대 F키·상품·포장 알바·대사·저장은 유지한다.
- 신규 표정 전환·자율 걷기·꽃 기분 모션은 추가하지 않았다. 모델에 보존된 걷기를 NPC가 자동 재생하지 않는다. 토리와 폐기 의상은 복원하지 않는다.

`scratch/check-bongbong-game.cjs`로 웹과 기존 실행본 리소스 각각 채택 장식, 한 명 표시, 의상 없음, 높이·바닥 접지, NPC 충돌·출입 통행, 실제 F키 계산대 콜백, 에셋 누락·브라우저 예외 0건을 확인했다. `web/tests/exhibition.test.mjs` 6개 통과.

웹의 첫날 전시 잡화점 장면을 직접 열어 봉봉 한 명 표시·활성화·오류 없음을 확인했다. 실행본의 일반 모드 검사는 통과했으나 추가 첫날 장면 검사는 로딩 대기가 길어 완료하지 못했다. 전체 `scratch/check-exhibition.cjs`는 잡화점 진입 전 시작 정류장의 모아 접근 대기에서 시간 초과했다(커서 0, 브라우저 예외 없음). 이번 적용으로 첫날 전체 완주 검사를 통과했다고 기록하지 않는다.

[웹 화면](../output/bongbong-game-v1/store.png) · [실행본 리소스 화면](../output/bongbong-game-v1/store-runtime.png) · [웹 검사 결과](../output/bongbong-game-v1/browser-check.json) · [실행본 검사 결과](../output/bongbong-game-v1/browser-check-runtime.json)

`electron-app/dist/win-unpacked/resources/web/`에도 같은 GLB와 위 두 모듈을 동기화했다. 기존 실행본 리소스의 브라우저 검사이며 Electron 직접 실행·설치 프로그램 재빌드·사용자 최종 플레이 검수와 구분한다. 이전 삭제 기록 중 봉봉 적용 범위에 한해 이번 요청이 우선한다. 제작 원본과 저장은 보존한다.
