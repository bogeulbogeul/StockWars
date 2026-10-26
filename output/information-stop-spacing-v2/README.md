# 안내소·정류장 간격 수정 v2

P1 · ✅ 웹·기존 실행본 적용·자동 검증 / ⏳ 사용자 최종 시각·플레이 검수

안내소를 `(1150, 2230)`에서 `(1400, 2100)`으로, 오른쪽 250·북쪽 130 이동했다. 정류장 `(1000, 2325)`과 모아·도착 위치는 유지했다. 안내소로 들어가는 길을 중앙 산책로에 연결하고 서쪽 길은 안내소 서쪽으로 우회시켰다. 전시 스토리 안내소 위치는 기존의 동적 좌표 연결을 따른다.

`townModelBuildings.js`·`townLandscapeLayout.js`를 웹과 `electron-app/dist/win-unpacked/resources/web`에 반영했다. `scratch/check-current-exteriors.cjs`를 양쪽에 실행해 9종 로딩·건물 충돌 영역 겹침 없음·길 10단위 표본 차단 0건·도착 지점에서 모든 입구 도달·시계·작은 화면·JavaScript 오류 없음 검사를 통과했다. 결과는 `web-checks.json`과 `desktop-checks.json`, 전경은 `web-overview.png`다. 설치 프로그램 재빌드·사용자 수동 플레이 검수와 구분한다.
