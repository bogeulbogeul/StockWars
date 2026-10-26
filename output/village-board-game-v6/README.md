# 확정 게시판 UI 게임 적용 v6

확정본 output/village-board-readable-v6의 왼쪽 파스텔 공고 목록·오른쪽 아이보리 상세 화면을 실제 마을 게시판에 적용했다. 공고문 크게 보기와 복귀·Esc, 게시판 근접 F키/버튼, 전시 포장 공고 확인 흐름을 유지한다. 일반 마을/전시 설치 연결을 확인했으며 타이틀·실내·전환·다른 모달 중에는 열리지 않는다.

웹 및 기존 실행본 resources/web의 CSS/컴포넌트/설치 모듈을 동기화하고 CSS/컴포넌트 요청 버전을 readable-v6로 갱신했다. 게임 공통 리셋 스타일의 영향을 막아 창을 중앙 정렬하고 명시적 한글 글꼴을 사용한다. hashes.json에 소스 일치를 기록한다. 기존 설치 프로그램은 재빌드하지 않았다.

검증: node web/tests/villageBoardInteraction.browser.cjs [web 또는 electron-app/dist/win-unpacked/resources/web]
실제 게임 마을 로딩 후 먼 거리 F 차단, 근접 F·화면 버튼 열기, 확정 상세 표시, 공고 전환, 확대/복귀, 모달 중 이동 차단, 닫은 후 WASD 재개를 확인한다. web-board.png/desktop-board.png는 실제 게임 위에 열린 확정 UI다. 사용자 최종 플레이 검수는 별도다.

최종 결과: 중앙 정렬 보정 후 웹·기존 실행본 리소스 양쪽 실제 게임 브라우저 검사 모두 통과. 창의 상하좌우 최소 여백 검사, 공고 내용 전환·확대/복귀, 입력 검사 및 JavaScript 오류 0건을 확인했다.
