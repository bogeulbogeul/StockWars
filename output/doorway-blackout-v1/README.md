# 열린 출입구 검정 단색 정리 — 2026-10-25

사용자 요청: 문을 열었을 때 출입구 안쪽에 검정 이외의 요소가 보이는 경우 수정.

`DoorwayBlackout.js`에 실제 문짝 정점을 건물 로컬 좌표로 투영한 하나의 꽉 찬 출입구 윤곽을 만들었다. 기존 문짝 메시를 검정으로 복제하던 방식의 창유리 구멍·패널 홈·양문 중앙 틈을 채운다. 아치 윤곽과 정면 문의 크기를 따르며 문틀·계단·열린 문짝/손잡이는 유지한다. 검정 MeshBasicMaterial은 fog/toneMapping을 사용하지 않으며 depth test/write는 유지한다. 가림막은 열려 있는 동안만 표시하고 static batching/culling 대상에서 제외한다.

안내소·집·잡화점의 `InformationDoor.js`와 은행·가구점·쉼터·증권사·서점·우체국의 `ExteriorDoors.js`에서 같은 가림막을 사용한다. 양문 두 장에는 중앙 틈이 없는 공통 가림막 하나를 쓴다. 기존 경첩 축·개방 방향/시간/각도·근접 개폐·도보 출입·저장·원본 GLB는 유지한다. 실내 제작이나 보조 출입문 개편은 이번 범위가 아니다.

검증: `node --test web/tests/doorwayBlackout.test.mjs web/tests/homeDoor.test.mjs web/tests/exteriorDoors.test.mjs web/tests/doorwayTraversal.test.mjs` 8개 통과. 실제 창구멍 메시와 양문 중앙 틈을 통과하는 ray가 새 검정 면에 막히며, 문틀 밖은 가리지 않는 회귀 검사를 포함한다.

`scratch/check-doorway-blackout.cjs`는 실제 전시 마을의 건물 9곳을 열어 정면/사선 18개 화면을 렌더하고 출입구 내부의 픽셀 색을 검사한다. 열린 문짝/부속품 및 그 가장자리 안티앨리어싱에 해당하는 표본은 별도로 제외하고 가림막 내부 표본은 RGB 0~2 범위로 검사한다. 닫힘 후 가림막 숨김과 페이지 오류도 확인한다. 결과는 `web-checks.json`/`executable-checks.json`, 실제 렌더는 `web-*-*.png`/`executable-*-*.png`다. 화면 인덱스는 은행·가구점·쉼터·증권사·서점·우체국·안내소·집·잡화점 순서다.

변경한 런타임 3개 파일을 웹/기존 실행본 resources/web에 반영한다. 설치 프로그램 재빌드와 사용자 최종 시각·플레이 검수는 별도다.

최종 결과: 웹·기존 실행본 각각 18개 시점, 검정 내부 표본 1636개에서 비검정 표본 0·페이지 오류 0·9개 문 닫힘 후 가림막 숨김을 통과했다. 런타임 3개 파일 SHA256 일치를 확인했다.
