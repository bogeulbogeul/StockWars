# 스마트폰 설정 확장 v2

사용자 요청으로 현행 아이보리 2D 설정 앱에 이동키와 추가 설정을 적용했다.

- 이동: WASD / 방향키 / HJKL 프리셋, 방향별 문자·방향키 직접 지정, Esc 취소, 중복 및 Q/E/R 고정키 거부. WASD 선택으로 기본 이동키 복구.
- 기존 설정 저장소 `stockwars.settings.v1` 재사용. 효과음 크기 0~100%, 화면 효과 줄이기(기존 UI 전환·구름·강수) 추가. 음악 설정과 별도 저장하며 기존 음악 켜기/끄기·음량 유지.
- 게임 입력은 gameKey를 공통 사용. 전시 도착·모아 따라가기·게시판 이동·착석 해제·잡화점 대화 중 이동 차단을 새 이동키에 연결. 실내 기존 gameKey 입력 사용. 이동 안내 키 표시 갱신.
- 효과음은 기존 버스·먹기·자판기 재생 시 설정값을 사용하며 이미 재생 중인 일회성 효과음을 소급 변경하지 않는다. OS 동작 줄이기 설정도 존중한다.
- 구형 설정 화면 및 폐기 기능은 복원하지 않는다. 상단 음악 UI도 재생성하지 않는다.

## 적용 및 검증

`synced-files.txt`의 웹/기존 실행본 resources/web 파일을 동기화했다. 설치 프로그램은 재빌드하지 않았다.

`node --test web/tests/keyBindings.test.mjs web/tests/settings.test.mjs web/tests/townMusic.test.mjs`: 8개 통과.

`node scratch/check-phone-settings-controls.cjs` 및 resources/web 대상 브라우저 실행: 양쪽 통과. 프리셋 3종, 직접 지정, 고정키·중복 거부, Esc 취소, 방향키 매핑·기존 W 해제, 전시 도착/따라가기 실제 컨트롤러 이동·keyup·설정 변경 시 held 해제, 효과음 저장, 화면 효과 클래스, 재실행 복원, 음악 회귀·오프닝 음소거·상단 버튼 없음·전시 저장 불변·페이지 오류 0건 확인.

`web-settings.png`, `desktop-settings.png` 및 mobile PNG는 실제 게임 화면. 자동 검사와 사용자 최종 조작·청취·시각 검수는 구분한다.
