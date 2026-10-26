# 꽃 밟고 통과 v1

P1 · ✅ 웹·기존 실행본 적용·자동 검증 / ⏳ 사용자 최종 플레이 검수

사용자 요청으로 마을의 `Flowers-mini-*` 모델에 `userData.walkThrough`를 지정했다. 공통 충돌 생성기 `createTownPropBodies`가 이 모델을 생략하므로 걷기와 점프 충돌이 모두 제거된다. 꽃 메시/표시/배치/그림자는 유지하며 꽃 옆의 나무·벤치·건물 등은 계속 막힌다. 실내 꽃 장식과 다른 소품은 일괄 변경하지 않았다.

`TownModelScene.js`·`TownPropBodies.js`를 웹·기존 실행본에 동기화했다. `node --test web/tests/flowerWalkThrough.test.mjs web/tests/jumpCollision.test.mjs web/tests/exteriorBuildingBodies.test.mjs`의8개 검사가 통과했다. `scratch/check-flower-walkthrough.cjs`를 양쪽에 실행해 실제 꽃49개 그룹의 표시 유지·보행/점프 충돌0건·다른 장애물이 없는 꽃 중심 보행 가능·벤치 충돌 유지·JavaScript 오류 없음을 확인했다. 다른 장애물과 겹친 꽃 주변을 무조건 통과시키지는 않으며 실제 중심 보행 가능 수는38/49다. 결과는 `web-checks.json`·`desktop-checks.json`에 저장했다. 설치 프로그램은 재빌드하지 않았다.
