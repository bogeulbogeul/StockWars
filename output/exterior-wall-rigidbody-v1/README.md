# 건물 외벽 고정 충돌체

P1 · ✅ 웹·기존 실행본 적용 및 자동 검증 / ⏳ 사용자 최종 플레이 검수

현재 외관 9종의 전체 모델 사각형·발밑 반경 16 판정을 실제 낮은 메시 외곽·몸통 반경 38 판정으로 교체했다. `ExteriorBuildingBodies.js`는 지면 높이 6~100 구간과 겹치는 외벽·문·기둥·돌출부를 메시별로 투영한다. 높은 지붕/처마 때문에 보이지 않는 큰 벽이 생기지 않도록 높이 클리핑을 사용한다. 모서리는 월드 X/Z의 원-사각형 접촉으로 계산하고, 공간 셀로 가까운 충돌체만 검사한다. 고정 충돌체이며 모델이나 건물 배치, 문 상호작용 조건은 변경하지 않았다.

기존 일반 마을·전시 첫 도착의 canStand/이동 분할과 겹침 복구를 재사용한다. 기존 소품·NPC·실내 충돌은 유지한다. 출입은 기존 접근 후 상호작용 흐름이며 캐릭터가 닫힌 문 모델을 직접 관통해 들어가는 방식으로 바꾸지 않는다. 건물 내부/새 시설/저장·경제 효과는 추가하지 않았다.

추출 메시 수: 집 59, 안내소 34, 잡화점 39, 가구점 32, 증권사 111, 은행 31, 펍 75, 서점 58, 우체국 47. 메시별 사각형 근사이므로 세부 곡면에는 여유가 생길 수 있다.

검증:

- `node --test web/tests/exteriorBuildingBodies.test.mjs web/tests/indoorWallBodies.test.mjs web/tests/indoorFurnitureBodies.test.mjs web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs`: 11개 통과. 사방 고속 접근 차단·모서리 거리·머리 위 처마 제외·겹침 복구 및 기존 실내/가구/NPC/소품 회귀 확인.
- `node web/tests/arrivalBench.browser.cjs [리소스 루트] output/exterior-wall-rigidbody-v1`: 웹·기존 실행본의 건물 9종 모두 충돌체 존재/중심 차단, 실제 접근 표본의 몸통 여유 38 이상, 겹침 복구를 확인했다. 정류장 출발 12단위 경로 탐색으로 9곳 모두 기존 입장 범위 안의 출입문 접근 좌표에 도달했다. 집 정면에서 벽 방향 이동도 확인했다.
- 같은 브라우저 검증에서 실내 7곳 출구/복귀 문·계산대 접근과 첫 도착 벤치·모아 대화 접근 회귀 검사를 통과했다. JavaScript 오류 0건.
- `web-exterior.json`, `desktop-exterior.json`에 건물별 출입 좌표·접촉 여유·복구 결과가 있다. `web-exterior.png`는 실제 집 정면 접촉 렌더이며 열어 확인했다. 실내 회귀 결과/화면도 같은 폴더에 보존했다.

기존 실행본 resources/web에 변경 모듈 3개를 동기화했다. 설치 프로그램은 재빌드하지 않았다. 모든 외벽의 모든 방향에서 실제 키보드 플레이를 완료했다는 의미는 아니며 사용자 최종 접촉/플레이 검수는 별도다.

## 중복 검수 캡처 정리 — 2026-10-26

✅ 삭제 완료. 대조표의 web 캡처와 환경별 검증 기록은 보존했다.

아래 desktop PNG는 동일 폴더 web PNG와 SHA-256까지 일치해 사용자 승인으로 삭제한다. 환경별 JSON 검증 기록과 촬영 스크립트는 별도로 유지한다. 기존 `desktop-*.png` 안내는 아래 대응 web PNG를 따른다. 이 대조표는 기존 촬영 시점의 이미지 내용 일치를 기록하며 새 플레이 검증을 의미하지 않는다.

| 삭제 desktop 캡처 | 보존 web 캡처 | SHA-256 |
|---|---|---|
| `desktop-store.png` | [web-store.png](web-store.png) | `d8692e6dcdb3912c498b84bcfa1e1f3097bf36ed1d4474c92170b0ef0463c6ac` |
| `desktop-bank.png` | [web-bank.png](web-bank.png) | `ca386911c5c4c0d13e29d05c56e121de268bb5a6735f2a72378814f125b31db5` |
| `desktop-information.png` | [web-information.png](web-information.png) | `612be2ed0bc44ad8b2faafa849c1702ee6b57391604b13015d79434007c5731c` |
| `desktop-stock.png` | [web-stock.png](web-stock.png) | `d528324c52bc918125714a0bffb751ebf393b8a574bb4d0dc3c05c96cb23a336` |
| `desktop-training.png` | [web-training.png](web-training.png) | `6b93ddde05815b2743e6fb750703950f629cdc9a50ee867ae1236ec893bd192e` |
| `desktop-home.png` | [web-home.png](web-home.png) | `64e1f640d16bcb89828da65b7129e5eac6c6d957440d5f287fb392a58577be69` |
