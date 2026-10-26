# 서점 소개 버벅임 수정 v3 — 2026-10-25

P1 · ✅ 웹·기존 실행본 적용 / 실제 소개 장면·화면·대화·이동 검증 / ⏳ 사용자 최종 플레이 검수

## 원인과 결과

소담 서점 소개에서 모아와 플레이어가 좌우로 서는 실제 대화 구도를 실행본으로 재현했다. 이 구도에서는 카메라와 캐릭터 사이의 **은행 처마 `Bank_Continuous_Joined_Eaves` (1,538,904삼각형)**를 정밀 레이 검사하는 데 한 프레임 약110ms가 걸렸다. 서점 자체의 렌더링이 주원인은 아니었다. 같은 서점에서도 캐릭터가 남북으로 서는 구도에서는 이 검사가 약1ms여서, 소개할 때 유독 느린 현상과 일치했다.

최종 교차 측정:

| 항목 | 기존 정밀 검사 | 공간 인덱스 검사 |
|---|---:|---:|
| 평균 프레임 시간 | 122.64ms | 25.30ms |
| 평균 FPS | 8.15 | 39.52 |
| p95 프레임 시간 | 150.2ms | 66.7ms |
| 평균 가림 검사 | 119.46ms | 1.17ms |
| p95 가림 검사 | 141.4ms | 1.90ms |
| 그리기 호출 | 1,014 | 1,014 |
| 삼각형/프레임 | 5,109,740 | 5,109,740 |

가림 검사 CPU 시간은 약99% 감소했다. 다른 GPU/프레임 간격 지연까지 모두 제거하거나 고정60FPS를 달성한 것은 아니다. 실제 장치와 소개 위치에 따라 수치는 달라진다.

`comparison.json`이 최종 판정 자료다. 조건 전환 직후 프레임 간격 변동을 확인해 조건마다2.5초 안정화 시간을 두고 다른 검증 브라우저가 종료된 뒤 다시 측정했다. 각 조건45프레임씩 꺼짐→켜짐→켜짐→꺼짐으로 진행해 조건별90프레임을 합산했다. `comparison-short-warmup.json`·`comparison-extended.json`·`diagnostic.json`·`after-diagnostic.json`은 개발 중 진단/보조 측정이며 최종 대표 수치와 구분한다.

## 구현

- `TriangleRayIndex.js`: 원본 삼각형의 공간 계층을 만든다. 광선이 통과하는 상자 안의 삼각형만 기존 Three.js와 동일한 `Ray.intersectTriangle`로 검사한다. 앞/뒷면·양면·월드 변환·near/far·기존 bounding sphere/box 조건을 유지한다. 단순한 대체 충돌 상자를 정답으로 사용하지 않는다.
- `OcclusionQueries.js`: 고정 메시 중10만 삼각형 이상인 형식에 맞는 geometry만 초기 로딩 중 준비한다. 현재 은행/펍의 고밀도 geometry2개이며 상주 인덱스 배열은 합계 약31.3MiB다. 렌더 정점·인덱스·재질은 수정하지 않는다.
- 스킨/모프/인스턴스·별도 raycast·재질 배열·부분 drawRange 등은 기존 검사로 처리한다. 원본 position/index 속성 또는 버전이 바뀌면 해당 인덱스를 사용하지 않고 원래 검사로 돌아간다.
- `DialogueOcclusion.js`: 같은 광선과 가림 정책을 사용하며, 한 건물의 가림이 확인되면 그 건물 안의 나머지 검사를 끝낸다. 검사 주기를 낮추거나 이전 프레임의 결과로 대체하지 않는다. 레이어와 자식 재귀 차단도 유지한다.
- `TownModelScene.js`: 소개에 진입하기 전에 로딩 과정에서 인덱스를 준비한다. 대화 시작 시 큰 인덱스를 만들며 멈추지 않도록 했다.

서점/은행 모델·배치·NPC 자세·캐릭터·대사·카메라·해상도·음악·저장 스키마를 변경하지 않았다. 앞선 v1/v2 렌더 최적화도 유지한다.

## 실제 실행본 검증

대상은 `electron-app/dist/win-unpacked/StockWars Demo.exe` 자체이며 Electron28.3.3 / Chromium120.0.6099.291, AMD Radeon(TM) Graphics의 ANGLE Direct3D11,1264×741,DPR1,낮 음악 켜짐이었다. 별도 테스트 프로필을 사용하고 실제 시작 버튼을 눌러 진입했다.

긴 튜토리얼 이동을 반복하지 않도록 테스트 세션 안에서 서점 앞 캐릭터 위치와 대본 커서를 설정한 다음, **실제 `app.render()`의 서점 소개·표정·대화 카메라·대화 UI**로 측정했다. 사용자 저장을 이 장면으로 덮어쓰지 않았다. 최종 비교에서는 모아 `(2700,2010)`, 플레이어 `(2600,2010)`를 사용했다. `compare.cjs`에 재현 절차가 있다.

- 실제 F키로 서점 대사3줄(커서42→43→44)이 순서대로 진행되고 패널이 유지됨을 확인했다. `comparison.json`의 dialogue와 `bookstore-line-0.png`~`2.png`를 따른다.
- 서점에서 A키로 약193게임 단위 이동한 뒤 유효 위치와 대화 카메라 복귀를 확인했다. 모아 쪽 D입력은 기존 NPC 몸체 충돌에 막히는 것도 확인했다. `leave-bookstore.json`·`leave-bookstore.png`를 따른다.
- 관찰된 JavaScript 오류0건이다. 최적화가 켜지고 계측이 제거된 상태를 확인한 뒤 테스트 실행본을 정상 종료했다.

## 화면/가림 결과 보존

실제 실행본에서 캐릭터 위치4개와 카메라 위치/각도4개, 총8개 조건을 검사했다. 매 조건에서 같은 프레임의 기존 검사/새 검사를 실행하고 건물별 원본 메시 숨김 목록과 캔버스를 비교했다.

**8조건 모두 가림 목록 동일, 이미지8쌍 모두 픽셀 차이0개**였다. `visual-masks.json`·`pixel-diff.json`·`visual-*-baseline.png`·`visual-*-optimized.png`를 보존했다. 실제 소개 화면도 열어 확인했다. 이 검증 범위의 동일성을 모든 가능한 플레이 장면의 수학적 보증으로 확대하지 않는다.

은행·펍 소개와 서점의 다른 대화 방향도 보조 확인했다. 렌더 호출/삼각형 수는 동일하며, 시점을 옮기거나 건물을 숨기는 새 예외 규칙을 만들지 않았다.

## 회귀와 적용

- 무작위3,600개 광선과 경계·평행·내부 광선, 앞/뒤/양면, 인덱스 유무, 변환·near/far, geometry 수정 시 fallback, 고밀도 메시 등의 native 비교 테스트를 포함해 총27개 단위 테스트 통과.
- 웹의 기존 정류장 충돌 복구·걷기·추가13개 좌석·실제 E/WASD/버튼·정류장 복귀 회귀 검사 통과. `all-seats/web-seats.json`에 결과와 오류0건을 기록했다.
- `TownModelScene.js`·`DialogueOcclusion.js`·`OcclusionQueries.js`·`TriangleRayIndex.js`를 기존 실행본 resources/web에 동기화했고, 웹/실행본 SHA256 일치를 `deployment-hashes.json`에 기록했다. 수정 전 파일은 `desktop-backup/`에 보존했다. 실행 파일 자체를 새로 빌드하거나 설치 프로그램을 재생성하지 않았다.

```powershell
node --test web/tests/occlusionQueries.test.mjs web/tests/occlusionQueriesDense.test.mjs web/tests/townStaticBatches.test.mjs web/tests/townRenderCulling.test.mjs web/tests/jumpCollision.test.mjs web/tests/somangiJump.test.mjs web/tests/seatedStory.test.mjs web/tests/storyCollisionPlacement.test.mjs web/tests/townPropBodies.test.mjs
node web/tests/arrivalBench.browser.cjs web output/bookstore-performance-v3/all-seats
```
