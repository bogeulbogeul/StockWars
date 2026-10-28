# 창 전체 채움 복구 — 2026-10-28

오프닝이 공용 렌더러를 반환하며 저장했던 옛 크기를 복원할 때, 마을의 뷰포트 크기 캐시가 이미 최신이면 resize가 조기에 끝나 캔버스가 작은 크기로 남을 수 있었다. 사용자 스크린샷처럼 우측/하단에 배경이 노출되는 경로를 수정했다.

- TownModelScene.resize: 실제 renderer.getSize와 canvas.style.width/height도 비교한다. 기존 캐시가 같아도 렌더/표시 크기가 다르면 갱신한다. Vector2는 재사용한다.
- ArrivalRenderer.dispose: 원래 부모에 캔버스를 복구한 뒤 live.resize()로 현재 뷰포트에 맞춘다. 기존 로딩 중 숨김·첫 프레임 공개·원래 표시 상태 복구는 유지한다.
- 웹과 electron-app/dist/win-unpacked/resources/web의 두 파일을 동기화했다. 설치 프로그램은 재빌드하지 않았다.

scratch/check-town-window-fit.cjs의 웹/기존 실행본 리소스 검사에서 다음 여섯 경로의 캔버스 표시 크기·뷰포트 크기·카메라 비율 일치를 확인했다: 초기1264×742, 대여 중 최대화 후 반환1920×990, 오래된 렌더러 크기 복구, 오래된 인라인 CSS 크기 복구, 축소1024×768, 재확대1600×900. pageerror0건. web-checks.json·packaged-checks.json 및 maximized PNG를 따른다. 테스트는 렌더러 대여/복구 상황을 직접 구성하며 게임영상 촬영이 아니다. 기존 실행본 리소스는 브라우저로 검사했다.

scratch/check-arrival-loading-frame.cjs web 회귀검증도 통과했다: 숲 지연2.5초 동안 캔버스 숨김, 완성 첫 프레임 건물9개, 대사3단계와 로딩 중 건너뛰기/표시 상태 복구. 결과는 ../arrival-loading-frame-v1/web-checks.json에 있다.

실행 중인 게임에는 이전 자바스크립트가 남으므로 게임을 완전히 종료하고 다시 실행해야 수정본을 불러온다.
