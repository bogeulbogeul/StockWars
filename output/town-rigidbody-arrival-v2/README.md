# 정류장 벤치 관통 수정 v2

P1 · ✅ 웹·기존 실행본 적용 및 재현 검증 / ⏳ 사용자 최종 플레이 확인

사용자 첨부 화면의 원인은 `app/exhibition/Arrival.js`의 전시 첫 도착 전용 이동이 `canStand`를 호출하지 않고 좌표를 직접 변경한 것이었다. v1의 일반 TownPlayerController 테스트로는 이 경로를 검증하지 못했다.

`TownBodyMovement.js`로 이동 분할·축별 충돌 검사를 공유하고 첫 도착 전용 WASD에도 연결했다. 모델 충돌체 준비 전에는 도착 이동을 대기한다. 이미 벤치 안에 저장된 좌표는 도착 영역 내 가까운 유효 좌표로 보정한다. 일반 마을 이동에도 같은 이동 함수와 겹침 복구를 사용한다. 캐릭터·모아·정류장 모델과 스토리 보상은 바꾸지 않았다.

검증:

- `node --test web/tests/townPropBodies.test.mjs`: 저장 겹침 복구·고속 재진입 차단, 높은 지붕 제외, 사방 달리기 차단 총 3개 통과.
- `node web/tests/arrivalBench.browser.cjs [web 루트]`: 실제 GLB의 Bench_Seat 중심에 겹친 저장 위치를 주입하고 첫 도착의 실제 키보드 입력으로 검사. 겹침 복구 후 벤치 재진입 차단 및 모아 대화 거리 접근을 웹·기존 실행본 양쪽에서 확인했다. JavaScript 오류 0건.
- `web-arrival.json`, `desktop-arrival.json`에 재현 전후 좌표 기록. `web-arrival-bench.png`, `desktop-arrival-bench.png`에 수정 후 실제 화면 기록.

기존 실행본 resources/web에도 변경 모듈 4개를 동기화했다. 설치 프로그램은 재빌드하지 않았다. 이번 검증은 문제가 보고된 첫 도착 화면과 공유 이동 함수 대상이며 모든 실내/모든 스토리 연출의 접촉 완료를 뜻하지 않는다.
