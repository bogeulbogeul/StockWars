# 마을 렌더링 최적화 v1 — 2026-10-25

P1 · ✅ 웹·기존 실행본 리소스 적용 / 자동 검증 / ⏳ 사용자 최종 플레이 검수

## 변경

- `TownRenderCulling.js`: 고정 건물·소품과 접지 그림자의 월드 경계를 초기 1회 계산한다. 기존 지면 곡률 셰이더의 Z 구간별 최대/최소 Y 변형을 경계에 반영하고, 현재 카메라 밖의 모델과 고정 하위 메시를 렌더링하는 동안만 제외한다. 경계에는 2게임 단위 여유를 둔다.
- 루트와 부품을 함께 검사해 전체 건물은 화면에 걸쳐 있어도 화면 밖 지붕/기둥/나무 부품의 그리기는 생략한다. 시계 바늘은 회전하므로 고정 부품 경계에서 제외하고 건물 전체 경계만 사용한다. 캐릭터·날씨·하늘·큰 지면은 등록하지 않는다.
- `TownModelScene.js`: 렌더링만 새 모듈로 전달한다. 임시 visibility는 finally에서 복구하므로 충돌·좌석 조회·가림 판정·다음 프레임의 상태에는 남지 않는다.
- `DialogueOcclusion.js`: 그 프레임에 이미 가림 대상으로 확인된 모델의 추가 광선 검사만 생략한다. 다른 모델은 계속 검사하고, 여섯 광선·매 프레임 검사·숨김/복구 규칙은 유지한다. 검사 주기를 줄이거나 이전 프레임 결과로 대체하지 않는다.

GLB·텍스처·배치·재질·해상도·안티앨리어싱·그림자·NPC 자세·캐릭터·기능·저장 스키마는 변경하지 않았다. 인스턴싱이나 메시 병합은 이번 적용에 포함하지 않았다.

## 성능 측정

Edge headless, 1280×800, DPR 1. 초기 로딩을 기다리고 조건별 30프레임 워밍업 후 120프레임 측정했다. 한 브라우저에서 같은 장소의 새 culling 꺼짐/켜짐을 비교한다. 두 조건 모두 추가 가림 검사 생략은 적용된 상태이므로 기존 전체 코드와의 직접 비교와는 구분한다. 웹과 실행본 리소스 검증은 별도 브라우저 실행이다.

| 웹 장소 | 평균 프레임 ms, 꺼짐→켜짐 | 그리기 호출, 꺼짐→켜짐 | 삼각형/프레임, 꺼짐→켜짐 |
|---|---:|---:|---:|
| 정류장 | 29.96 → 22.26 | 5,857 → 3,865 | 9,204,058 → 5,846,963 |
| 광장 | 30.76 → 16.62 | 5,853 → 1,845 | 9,204,050 → 2,973,293 |
| 북쪽 | 30.25 → 16.74 | 5,422 → 1,021 | 8,819,394 → 1,860,525 |

웹 표본의 평균 프레임 시간은 약26~46% 감소했다. 평균 draw CPU 시간은 각각29.99→21.72ms, 30.67→9.00ms, 30.24→5.41ms였다. 정류장 p95 프레임은 약50ms로 남아 있으므로 모든 순간 끊김 제거 또는 고정60FPS를 의미하지 않는다. 실제 Electron 프로세스에서의 GPU/FPS 보장과도 구분한다. 측정값은 장치·장소·백그라운드 부하에 따라 달라진다.

기존 실행본 리소스의 평균 프레임 시간도 정류장28.65→21.33ms, 광장27.84→16.62ms, 북쪽29.48→16.64ms로 감소했다. 이 리소스를 Edge에서 실행한 검증이며 Electron 28 프로세스 자체를 계측한 결과는 아니다. 원시 결과는 `web-profile.json`·`desktop-profile.json`이다.

## 화면과 기능 검증

- 정류장·광장·북쪽·서쪽·동쪽 5곳 × 카메라 종횡비1.6/.6/2.2 = 15개 상태에서, 동일 프레임의 culling 꺼짐/켜짐 캔버스를 저장해 픽셀을 비교한다. 실제 창 크기 변경과는 구분한다. 웹15쌍과 실행본 리소스15쌍 모두 픽셀 차이0개를 확인했다. 비교 자료는 `*-baseline.png`·`*-optimized.png` 및 `*-pixel-diff.json`이다. `verify_pixels.py`로 재검증할 수 있다.
- 곡률 경계의 표본 정점 유지, 렌더러 오류 시 visibility 복구, 시계 바늘 제외와 기존 점프/충돌/대화 자세 테스트 총16개 통과.
- 웹과 실행본 리소스 모두 정류장 충돌 복구·걷기와 추가13개 좌석의 착석/유효 출구를 확인했다. 은행 창구 NPC 점유석은 제외됐다. 마을·안내소·증권사·트레이닝룸에서 E키·버튼·WASD 일어서기, 정류장 재진입 회귀 검사를 통과했다. 브라우저 JavaScript 오류0건.
- `all-seats/web-seats.json`·`all-seats/desktop-seats.json`과 대표 좌석 렌더를 보존했다. 자동 검증과 사용자의 최종 시각·플레이 검수는 구분한다.

## 기존 실행본 적용

대상: `electron-app/dist/win-unpacked/resources/web/js/components/town3d/`

`TownModelScene.js`·`DialogueOcclusion.js`·`TownRenderCulling.js` 3개를 동기화했고 SHA256 일치를 `deployment-hashes.json`에 기록했다. 수정 전 실행본 파일은 `desktop-backup/`에 보존했다. 설치 프로그램 재빌드는 하지 않았다. 실행 중인 게임은 종료 후 기존 실행 파일을 다시 열어 새 모듈을 읽어야 한다.

## 재현

```powershell
node --test web/tests/townRenderCulling.test.mjs web/tests/jumpCollision.test.mjs web/tests/somangiJump.test.mjs web/tests/seatedStory.test.mjs web/tests/storyCollisionPlacement.test.mjs web/tests/townPropBodies.test.mjs
node output/town-performance-v1/profile.cjs
node output/town-performance-v1/profile.cjs electron-app/dist/win-unpacked/resources/web
node web/tests/arrivalBench.browser.cjs web output/town-performance-v1/all-seats
node web/tests/arrivalBench.browser.cjs electron-app/dist/win-unpacked/resources/web output/town-performance-v1/all-seats
```

성능 측정은 다른 브라우저 검증을 동시에 실행하지 않은 상태에서 수행한다.

## 후속: 기존 실행본 직접 이동 검증

2026-10-25 사용자 요청으로 기존 StockWars Demo.exe 자체(Electron28.3.3)를 실행해 실제 WASD 왕복을 비교했다. 입구29.8→43.8FPS, 광장30.8→51.2FPS, 북쪽32.3→54.9FPS였으며 긴 프레임도 감소했다. 입구의 일부 끊김은 남는다. 실제 실행본의 동일 프레임9쌍은 픽셀 차이0개였다. 절차·수치·한계·원시 자료는 [실행본 직접 검증](executable-walk/README.md)을 따른다.
