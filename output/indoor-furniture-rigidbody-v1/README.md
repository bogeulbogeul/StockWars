# 실내 가구 고정 충돌체

P1 · ✅ 웹·기존 실행본 반영 및 자동 검증 / ⏳ 사용자 최종 플레이 검수

`IndoorFurnitureBodies.js`가 현재 실내 모델의 메시를 바탕으로 고정 충돌체를 등록한다. 기존 수동 충돌 영역과 NPC 충돌을 보존하고 실제 가구 외곽에 플레이어 몸통 반경 38을 더해 판정한다. `TownPropBodies.js`의 높이 클리핑을 재사용해 지면 높이 6~100 구간만 투영하며 바닥·카펫·벽·창·현관·NPC는 가구 대상에서 제외한다. 높은 선반만 있는 빈 공간은 차단하지 않는다. 메시별 사각형 근사로 가구 곡면에는 여유가 생길 수 있다.

집·잡화점의 이동 검사도 모델 기반 판정으로 연결했다. 안내소·은행·증권사 로비·트레이닝룸·모의투자룸은 공통 CipherLobbyScene에서 연결한다. 실내에 이미 겹친 좌표가 있으면 기존 겹침 복구로 유효 위치를 찾는다. 가구/캐릭터 모델·NPC 확정 착석·저장·보상·폐기 기능은 변경하지 않았다. 별도 중력/동적 물리 엔진이나 가구 밀기는 도입하지 않는다.

현재 모델의 추출 충돌체 수(메시 단위): 집 0, 잡화점 109, 안내소 199, 은행 273, 증권사 로비 130, 트레이닝룸 154, 모의투자룸 202. 집의 현재 GLB는 바닥·벽만 있어 가구를 임의로 추가하지 않았다.

검증:

- `node --test web/tests/indoorFurnitureBodies.test.mjs web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs`: 총 7개 통과. 가구 사방 고속 이동 차단·겹침 복구·바닥/카펫/높은 선반 제외와 기존 소품/NPC 회귀 검사.
- `node web/tests/arrivalBench.browser.cjs [리소스 루트] output/indoor-furniture-rigidbody-v1`: 웹·기존 실행본의 실제 7개 실내에서 입장 위치 유효, 추출 가구 중심 차단, 입구에서 출구/복귀 문까지 8단위 격자 도달, 잡화점 계산대 상호작용 범위 접근을 확인했다. 첫 도착 벤치·모아 대화 접근 회귀 검사와 JavaScript 오류 0건도 확인했다.
- `web-furniture.json`, `desktop-furniture.json`: 방별 추출 메시·충돌체 수·출구 도달 결과. `web-*.png`, `desktop-*.png`: 실제 실내 렌더. 잡화점·안내소 실제 화면을 열어 확인했다.

기존 실행본 resources/web에 변경 모듈 5개를 동기화했다. 설치 프로그램은 재빌드하지 않았다. 모든 가구의 모든 방향을 실제 키보드로 접촉 검수한 것은 아니며 사용자 최종 플레이 확인은 별도다.

## 중복 검수 캡처 정리 — 2026-10-26

✅ 삭제 완료. 대조표의 web 캡처와 환경별 검증 기록은 보존했다.

아래 desktop PNG는 동일 폴더 web PNG와 SHA-256까지 일치해 사용자 승인으로 삭제한다. 환경별 JSON 검증 기록과 촬영 스크립트는 별도로 유지한다. 기존 `desktop-*.png` 안내는 아래 대응 web PNG를 따른다. 이 대조표는 기존 촬영 시점의 이미지 내용 일치를 기록하며 새 플레이 검증을 의미하지 않는다.

| 삭제 desktop 캡처 | 보존 web 캡처 | SHA-256 |
|---|---|---|
| `desktop-store.png` | [web-store.png](web-store.png) | `d8692e6dcdb3912c498b84bcfa1e1f3097bf36ed1d4474c92170b0ef0463c6ac` |
| `desktop-bank.png` | [web-bank.png](web-bank.png) | `675f8446f3e83966e5fed0c9ea6dfe94c6b81602059919a1bdb065dae0fdda43` |
| `desktop-information.png` | [web-information.png](web-information.png) | `942f09f229a543d2dc15e9e203870f3fbf740d4e1e58772112a37a64d7ba1387` |
| `desktop-stock.png` | [web-stock.png](web-stock.png) | `b2c35cc02f2919e43ee2daa5db27fb91fcf21bb19f16f7250c4edcfef2c29719` |
| `desktop-training.png` | [web-training.png](web-training.png) | `4a5b47ea71f378e65947dae5d6ce92a9d05abd108d58dc2bf6d3f77702a4eb6a` |
| `desktop-home.png` | [web-home.png](web-home.png) | `a9c029088cf430d65b027dfc2b89f926a6a4a63cf6ec57197094d4f71c2be432` |
