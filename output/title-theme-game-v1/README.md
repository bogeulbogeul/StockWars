# 타이틀 「작은 잎의 내일」 적용

2026-10-25 사용자 요청으로 제작된 테마송을 웹·기존 실행본 타이틀에 연결했다.

`web/assets/audio/title-theme-v1/small-leaf-tomorrow.wav`는 `output/theme-song-v1/`의 원본과 같다. 84.5초·32kHz·stereo PCM16이며 종지와 페이드가 있는 곡 전체를 반복한다. 새로운 무봉제 루프용 편곡을 만들거나 원곡을 잘라 붙이지 않았다.

`TitleScreen.js`에서 공통 `TownMusic`의 타이틀 모드를 켠다. 자동재생을 시도하고 브라우저 정책상 차단되면 첫 포인터/키/클릭 입력으로 이어간다. 타이틀에는 마을 음악을 함께 틀지 않는다. 아이보리 음악 버튼을 타이틀 내부에 배치해 타이틀 레이어/게임 inert 처리의 영향을 받지 않게 했고, Tab·Shift+Tab으로 시작/음악 버튼 사이를 이동하며 Enter·Space로 음악을 조절할 수 있다. 전용 음소거 설정과 화면 숨김 일시정지 정책을 마을과 공유한다.

시작 버튼에서 테마를0.8초 페이드아웃하며 기존 오프닝 음악과 버스 도착 연출을 유지한다. 타이틀/오프닝이 닫힌 뒤 해당 시간대의 마을 음악이6초 페이드 인으로 시작된다. 테마 음원이 늦게 도착해도 시작 버튼을 누른 후 다시 켜지지 않는다. 음원 실패나 자동재생 차단이 게임 시작을 막지 않는다.

긴 WAV에서 기존 Electron28 네이티브 디코더 종료가 확인된 이전 수정을 유지하고, PCM 직접 읽기에32kHz를 추가했다. WAV의 샘플레이트와 원본 길이를 보존한다.

## 검증

- `node --test web/tests/townMusic.test.mjs`: PCM16/RIFF 오류 검사 및 타이틀32kHz 보존.
- `node scratch/check-title-music.cjs web`: 실제 타이틀 재생, 원곡 길이/샘플레이트/반복, 키보드 음소거, 새로고침 후 음소거 유지, 오프닝 전환 시 테마 음량0, 건너뛰기 후 마을 음악 단독 재생·버튼 복귀.
- `node scratch/check-title-music.cjs electron-app/dist/win-unpacked/resources/web --electron`: 운영 저장 초기화/온라인 코드를 실행하지 않는 독립 Electron 창에서 실제 실행본 index.html을 file://로 로드해 같은 동작 검사.
- `node scratch/check-town-music.cjs web`: 기존 네 시간대 루프·교차 전환·실내 감음·실패 유지 회귀 검사.

실행 결과는 `*-validation.json`, 타이틀 화면은 `*-title.png`, 원본/웹/실행본 SHA256은 `hashes.json`이다. 자동 그래프/상태 검사와 사람이 듣는 최종 음악 검수는 구분한다.

웹 및 `electron-app/dist/win-unpacked/resources/web`에 테마곡·TownMusic·TitleScreen을 반영했다. 설치 프로그램은 재빌드하지 않았으며 열려 있는 게임은 새로고침/재실행해야 한다. 타이틀/시작 이미지·오프닝 원곡·버스·경제·게임 저장·광고영상은 변경하지 않았다.
