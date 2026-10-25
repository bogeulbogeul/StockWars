# 정류장 좌석 접근·소망이 착석

P1 · ✅ 웹·기존 실행본 적용·자동 검증·실제 렌더 확인 / ⏳ 사용자 최종 플레이 검수

사용자가 정류장 의자에 앉을 수 없고 투명벽처럼 막힌다고 보고했다. 원인은 낮은 `Smooth_Stone_Platform`까지 단단한 장애물로 등록된 것과 소망이의 정류장 착석 상호작용이 연결되지 않은 것이었다.

돌바닥을 고정 장애물에서 제외하고 실제 윗면 높이 `11.731843993`을 걷기 지지면으로 사용한다. 좌판·등받이·기둥·간판의 충돌은 유지한다. 바닥 위 점프의 머리 위 검사 높이도 지지면 높이만큼 늘렸다. 일반 마을/실내의 지면 높이는 바꾸지 않았다.

빈 왼쪽 자리 앞에서 **E키 또는 화면 버튼으로 앉기**, **E키/버튼 또는 WASD로 일어서기**를 연결했다. 모아 자리와 기존 앉기/일어서기는 그대로다. 소망이의 현재 걷기 모델과 기존 전신 다리 뼈만 사용해 착석하며, 일어서면 원래 다리 위치·회전을 복원한다. 새 GLB·폐기 착석 에셋을 불러오지 않는다. 착석 중 점프·먹기는 막고 안전한 앞쪽 위치에서 일어선다. 다른 의자·회복/경제 보상·착석 저장 기능은 추가하지 않았다.

검증:

- 실제 브라우저 키보드 E 착석/일어서기, WASD 이동 복귀, 마우스 버튼 양방향 전환을 웹·기존 실행본에서 확인했다.
- 좌석 앞까지 걸을 수 있고 서 있는 모델의 높이가 플랫폼 윗면과 일치한다. 착석 중 실제 스킨 정점의 좌판 위 최소 높이는 `44.031844043`, 좌판 윗면은 `43.731843842`로 약 0.3 여유를 둔다.
- 등받이·측면 난간·기둥·의자 다리·하부 보강대·앞 보·무릎 버팀대의 사각형 내부로 들어간 착석 정점 표본은 0개다. 정확한 메시-메시 교차 보증과는 구분한다.
- 일어서면 원래 다리 위치/회전이 복원되고 유효한 지면 위치에 선다. 플랫폼 위 Space 점프와 플랫폼 높이로의 정상 착지도 확인했다. 착석 중 Space는 착석 상태를 유지한다.
- `node --test web/tests/busStopGround.test.mjs web/tests/jumpCollision.test.mjs web/tests/somangiJump.test.mjs web/tests/exteriorBuildingBodies.test.mjs web/tests/indoorWallBodies.test.mjs web/tests/indoorFurnitureBodies.test.mjs web/tests/characterBodies.test.mjs web/tests/townPropBodies.test.mjs web/tests/storyCollisionPlacement.test.mjs`: 22개 통과.
- `node web/tests/arrivalBench.browser.cjs [web 루트] output/bus-stop-seat-v1`: 실제 좌석 검사. `web-seat.json`·`desktop-seat.json`에 접근/착석/복귀/점프 결과와 JavaScript 오류 0건을 기록했다. `web-seated.png`·`desktop-seated.png`는 실제 게임 렌더이며 웹 이미지를 열어 확인했다.

이전 소망이 앉기 보류 중 이번 정류장 좌석에 한해 새 요청을 적용했다. 모델·모아·건물 배치·저장 스키마·경제는 변경하지 않았고, 기존 실행본 resources/web의 관련 소스/CSS에도 반영했다. 설치 프로그램은 재빌드하지 않았다. 사용자 최종 시각·플레이 검수는 별도다.
