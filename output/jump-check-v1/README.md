# 점프 중 충돌 점검·보정

P1 · ✅ 웹·기존 실행본 적용·자동 검증·대표 렌더 확인 / ⏳ 사용자 최종 플레이 검수

## 발견 및 수정

현재 점프는 소망이 전체를 최대 20만큼 올리는 0.55초 동작이다. 지면 이동/착지 좌표는 유지하지만 기존 충돌 추출 높이는 102까지만 적용되어, 점프 시 102~122 높이에 닿는 나무의 낮은 수관·정류장·일부 돌출 간판 등이 빠질 수 있었다.

`JumpCollision.js`로 추가 높이 구간의 모델 충돌체를 만들었다. 점프 시작 위치에 전체 궤적을 위한 머리 위 여유가 없으면 점프를 거절하고, 공중 이동 중에는 같은 추가 충돌체를 검사한다. 기존 지면 충돌도 계속 적용하므로 벽/가구를 뛰어넘거나 그 위에 착지하는 기능을 추가하지 않았다. 충분한 공간에서의 점프 높이·시간·모델 자세와 일반 걷기 판정은 유지한다.

마을의 현재 건물·소품 194개와 실내 공통 가구 설치 흐름에 연결했다. 벽 메시의 출입구는 삼각형별 구간을 유지하며 일반 소품은 메시별 근사를 사용한다. 하늘·구름과 별도 NPC 모델은 추가 머리 위 고정체로 만들지 않는다. NPC는 기존 지면 몸통 충돌이 점프 중에도 유지된다. 실제 모델·건물 배치·저장·경제는 변경하지 않았다.

## 최종 검증

웹과 기존 실행본 각각 다음 결과를 확인했다.

| 검사 | 결과 |
|---|---:|
| 마을+실내 7곳 점프 높이의 8방향 경계 표본 | 25,992개 |
| 점프 진입/시작 위험 검출 | 0건 |
| 지면에서 합법이지만 점프 중 진입을 막아야 하는 표본 | 208개 차단 확인 |
| 실제 플레이어 `play('jump')`로 머리 위 장애물 아래 점프 시도 | 대표 9건 차단 |
| 공간이 있는 곳에서 장애물 방향으로 이동하며 점프 | 8개 공간, 각 40프레임 |
| 위 실제 점프의 표본 최고 높이 | 19.9816 |
| 착지 | 모든 공간에서 Y=0, 점프 상태 종료, 유효 지면 위치 |
| JavaScript 오류 | 0건 |

`web-baseline.json`은 수정 전 진단이다. 초기 진단은 모든 메시를 삼각형별로 나눴고 최종 구현은 일반 소품을 메시별로 합친 보수적 근사이므로 초기/최종 표본 수는 직접 비교하지 않는다. `web-final.json`과 `desktop-final.json`이 최종 결과다. `*-jump-home.png`·`*-jump-stock.png` 등은 최고점 부근 실제 렌더이며 집·증권사 화면을 열어 확인했다.

```
node --test web/tests/jumpCollision.test.mjs web/tests/somangiJump.test.mjs web/tests/exteriorBuildingBodies.test.mjs web/tests/indoorWallBodies.test.mjs web/tests/indoorFurnitureBodies.test.mjs web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs web/tests/storyCollisionPlacement.test.mjs
node web/tests/arrivalBench.browser.cjs web output/jump-check-v1 final
node web/tests/arrivalBench.browser.cjs electron-app/dist/win-unpacked/resources/web output/jump-check-v1 final
```

단위/회귀 테스트 19개 통과. 낮은 돌출물 아래 걷기 유지·점프 거절, 공중 이동 차단, 충분히 높은 지붕 제외, 점프 시간/반복 입력/정확한 착지와 기존 충돌을 검사했다. `output/jump-regression-v1/exterior-wall/`에서 웹·기존 실행본 모두 건물 9곳 입구와 실내 7곳 출구/복귀 문, 잡화점 계산대 접근 회귀 검증도 통과했다.

기존 실행본 resources/web에 변경 모듈 5개를 동기화했다. 설치 프로그램은 재빌드하지 않았다. 결과는 충돌 근사/검사 표본에서 검출된 위험 기준이며, 모든 표면의 연속적인 메시-메시 비관통 보증이나 모든 위치에서의 수동 플레이 완료를 뜻하지 않는다. 사용자 최종 시각·플레이 검수는 별도다.

## 중복 검수 캡처 정리 — 2026-10-26

✅ 삭제 완료. 대조표의 web 캡처와 환경별 검증 기록은 보존했다.

아래 desktop PNG는 동일 폴더 web PNG와 SHA-256까지 일치해 사용자 승인으로 삭제한다. 환경별 JSON 검증 기록과 촬영 스크립트는 별도로 유지한다. 기존 `desktop-*.png` 안내는 아래 대응 web PNG를 따른다. 이 대조표는 기존 촬영 시점의 이미지 내용 일치를 기록하며 새 플레이 검증을 의미하지 않는다.

| 삭제 desktop 캡처 | 보존 web 캡처 | SHA-256 |
|---|---|---|
| `desktop-jump-bank.png` | [web-jump-bank.png](web-jump-bank.png) | `d5f7e5b9e30d83a39448ab8921b1a166dc0c32b88d0a4f63dbd019f678969a2d` |
| `desktop-jump-information.png` | [web-jump-information.png](web-jump-information.png) | `7e72a1f68c1c708eba718f49a4fecd9b4207a5f32ba9fdbb2e1b6aa23b9d41ee` |
| `desktop-jump-stock.png` | [web-jump-stock.png](web-jump-stock.png) | `80586f43e823c817e5e2f2b55c3b1f631bdc98b4e8c072837634e0757d9cc92a` |
| `desktop-jump-store.png` | [web-jump-store.png](web-jump-store.png) | `4703bb6514bf1cebc8a20591dd0d6c59b52b80e0d818dafb2db74d5f9c49f864` |
| `desktop-jump-home.png` | [web-jump-home.png](web-jump-home.png) | `15c604cc041fb59d3f0e4f21b633c6046d6709f7d44d79d3348778ecb77b6b12` |
| `desktop-jump-training.png` | [web-jump-training.png](web-jump-training.png) | `778a5ed5980a8509bd8c56fe66501f2490473d23219948e68d75ac6756ab02ec` |
| `desktop-jump-simulation.png` | [web-jump-simulation.png](web-jump-simulation.png) | `5bded34b2837b9f9ee9812a4393137927325b970fc71a52eb71b1c0e412fc522` |
