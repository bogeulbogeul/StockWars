# 실내 벽 고정 충돌체

P1 · ✅ 웹·기존 실행본 적용 및 자동 검증 / ⏳ 사용자 최종 플레이 검수

실내 7곳의 실제 벽·기둥·하단 벽패널에 고정 충돌체를 추가했다. `IndoorWallBodies.js`는 모델에서 캐릭터 높이 6~100 구간과 겹치는 삼각형을 분리 추출하고, 몸통 반경 38의 원과 벽 구간의 접촉으로 판정한다. 문이 있는 단일 메시를 전체 사각형으로 합치지 않아 개구부를 유지한다. 카메라를 위해 숨긴 집 앞벽은 기존 집 출입구 좌표를 기준으로 양옆 두 구간만 차단한다. 바닥·창 위 장식·벽걸이 꽃은 벽으로 등록하지 않는다.

기존 가구/NPC 충돌·겹침 복구·문/복귀 상호작용을 유지하며 공통 실내 가구 설치 과정에 벽 충돌을 함께 연결했다. 벽 모서리에서는 원형 몸통으로 미끄러질 수 있다. 세밀한 벽패널의 충돌 조회는 128단위 공간 셀로 제한한다. 캐릭터/건물 GLB·카메라·저장·경제·폐기 기능은 변경하지 않았다. 고정 충돌 방식이며 중력이나 벽 파괴/밀기를 추가하지 않는다.

검증:

- `node --test web/tests/indoorWallBodies.test.mjs web/tests/indoorFurnitureBodies.test.mjs web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs`: 9개 통과. 하나의 메시 안에 있는 문 틈 유지, 숨긴 벽의 차단, 벽 앞 몸통 여유, 고속 관통 방지, 겹침 복구와 기존 가구/NPC 회귀 검사.
- `node web/tests/arrivalBench.browser.cjs [리소스 루트] output/indoor-wall-rigidbody-v1`: 웹·기존 실행본에서 집·잡화점·안내소·은행·증권사·트레이닝룸·모의투자룸의 벽 충돌체 존재/중심 차단, 유효 입장 위치, 출구·복귀 문 도달, 잡화점 계산대 접근을 확인했다. JavaScript 오류 0건.
- 벽 옆에서 가구와 겹치지 않는 표본 위치를 찾은 6곳은 실제 이동 함수로 벽을 향해 이동시켜 몸통 여유 38 이상을 확인했다. 잡화점은 벽 옆 표본 위치가 가구/기존 경계에 막혀 이 접근 검사를 수행하지 않았으며, 벽 충돌체 차단·문/계산대 도달 검사는 통과했다. 모든 벽 구간의 실제 플레이 접촉 완료를 뜻하지 않는다.
- `web-furniture.json`, `desktop-furniture.json`에 벽 구간 수·접근/출구 결과가 있다. `web-home.png`, `web-information.png`의 실제 벽 접근 렌더를 열어 확인했다. 다른 방 렌더도 같은 폴더에 보존했다.

기존 실행본 resources/web에 변경 모듈 3개를 동기화했다. 설치 프로그램은 재빌드하지 않았다. 사용자 최종 플레이 검수는 별도다.

## 중복 검수 캡처 정리 — 2026-10-26

✅ 삭제 완료. 대조표의 web 캡처와 환경별 검증 기록은 보존했다.

아래 desktop PNG는 동일 폴더 web PNG와 SHA-256까지 일치해 사용자 승인으로 삭제한다. 환경별 JSON 검증 기록과 촬영 스크립트는 별도로 유지한다. 기존 `desktop-*.png` 안내는 아래 대응 web PNG를 따른다. 이 대조표는 기존 촬영 시점의 이미지 내용 일치를 기록하며 새 플레이 검증을 의미하지 않는다.

| 삭제 desktop 캡처 | 보존 web 캡처 | SHA-256 |
|---|---|---|
| `desktop-store.png` | [web-store.png](web-store.png) | `d8692e6dcdb3912c498b84bcfa1e1f3097bf36ed1d4474c92170b0ef0463c6ac` |
| `desktop-bank.png` | [web-bank.png](web-bank.png) | `ca386911c5c4c0d13e29d05c56e121de268bb5a6735f2a72378814f125b31db5` |
| `desktop-information.png` | [web-information.png](web-information.png) | `612be2ed0bc44ad8b2faafa849c1702ee6b57391604b13015d79434007c5731c` |
| `desktop-stock.png` | [web-stock.png](web-stock.png) | `d528324c52bc918125714a0bffb751ebf393b8a574bb4d0dc3c05c96cb23a336` |
| `desktop-home.png` | [web-home.png](web-home.png) | `64e1f640d16bcb89828da65b7129e5eac6c6d957440d5f287fb392a58577be69` |
