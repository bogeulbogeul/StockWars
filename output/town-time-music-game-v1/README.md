# 마을 시간대별 음악 게임 적용

후속 요청으로 타이틀 테마곡도 연결했다. 현재 타이틀/오프닝 정책은 [타이틀 적용 기록](../title-theme-game-v1/README.md)을 우선하며 아래는 마을 음악 최초 적용 기록이다.

2026-10-25 사용자 요청: 제작한 새벽·낮·노을·밤 음악을 게임에 적용하고 시간대 변경 시 자연스럽게 전환.

## 적용

- `web/assets/audio/town-time-v1/`의 4개 WAV는 `output/town-time-music-v1/` 제작 원본과 동일하다.
- `TownModelScene.draw()`에서 `TownSky.currentStage()`를 재사용한다. 새 시간표·위치 요청·별도 시간 타이머 없이 지역/계절, 수동 시간과 전시 노을을 동일하게 따른다. 실내에서도 이 호출을 유지한다.
- `TownMusic.js`의 단일 AudioContext·트랙별 GainNode·AudioBufferSourceNode를 사용한다. 전체 샘플 범위로 반복하고 첫 재생은6초 페이드 인, 시간대 변경은6초 선형 교차 페이드다. 전환 중 재변경은 그 순간의 음량에서 이어가며 아직 살아있는 이전 소스로 돌아가면 재시작하지 않는다. 완료된 이전 소스는 정지·연결 해제한다.
- 새 음원을 준비한 뒤 전환하므로 다운로드 중에는 기존 곡을 유지한다. 늦게 도착한 과거 요청을 재생하지 않고 실패 시15초 간격으로 재시도한다. 네 곡은 필요할 때만 내려받아 디코딩 후 회차 메모리에 캐시한다.
- 기본 출력 음량은0.55, 실내는 그70%다. 집·잡화점·안내소·은행·증권사에서 기존 곡을 이어간다. 실제 체감 음량과 장시간 청취는 사용자 검수 대상이다.
- 사용자 포인터/키/클릭 이후 오디오를 활성화한다. 타이틀·오프닝 중에는 게임 음악을 재생하지 않는다. 화면 비표시에서는 AudioContext를 일시정지하고 복귀 시 이어간다. `pagehide`에서도 중지한다.
- 오른쪽 위 작은 아이보리 음악 버튼으로 켜기/끄기를 제공하며 전용 키 `stockwars-town-music-muted-v1`에 음소거만 저장한다. 구형 설정 화면을 복원하지 않는다. 기존 게임 저장·경제·타이틀/광고곡은 변경하지 않았다.

## Electron 호환 수정

기존 Electron28의 `decodeAudioData`로 제작 WAV를 읽으면 renderer exitCode -1073741819가 재현되었다. AudioContext 생성만은 통과했고, 게임 코드 없는 최소 페이지에서도 fetch·ArrayBuffer 읽기 다음 네이티브 디코딩 단계에서 종료되었다. 따라서 외부 디코더 없이 RIFF의 fmt/data 청크를 읽어 원본 PCM16 스테레오 샘플을 `AudioBuffer`로 옮긴다. 샘플레이트·채널·포맷·길이를 검사하며 다른 포맷을 임의 해석하지 않는다. 원본 WAV와 음악은 변환하지 않았다.

## 검증과 경로

- `node --test web/tests/townMusic.test.mjs`: 스테레오·양/음수 표본·RIFF 홀수 청크 패딩·손상/미지원 WAV 검사.
- `node scratch/check-town-music.cjs web`
- `node scratch/check-town-music.cjs electron-app/dist/win-unpacked/resources/web`
- `node scratch/check-town-music-electron.cjs`: 운영 저장 초기화/온라인 연결 코드를 실행하지 않는 독립 Electron 창에서 기존 실행본의 실제 index.html을 file://로 로드한다. GPU 가속은 검사 창에서만 비활성화한다.

웹/실행본 리소스 브라우저 검사는 실제 사용자 입력 전 무재생, 타이틀 무음,4곡 재생/루프/전환 끝 음량1·이전 소스 제거, 급변 시 기존 소스 재사용, 실내 감음·실외 복귀, 음소거 및 선호 저장, visibilitychange 처리, 수동 시계·전시 노을 우선, 로딩 실패 시 기존 음악 유지/재시도를 검사한다. OfflineAudioContext로 실제4곡의 끝→처음 구간을 렌더해 유한 표본·출력 에너지·경계 차이도 검사한다. visibilitychange는 document.hidden을 주입해 핸들러를 검사하므로 실제 OS 최소화의 모든 정책을 재현한 것은 아니다.

`web-validation.json`, `desktop-validation.json`, `electron-file-validation.json`은 실행 결과다. UI 캡처는 `web-music-control.png`, `desktop-music-control.png`다. 음원을 사람이 실제 들으며 평가하는 검수와 자동 신호 검증을 구분한다.

기존 로컬 실행본 `electron-app/dist/win-unpacked/resources/web`에 음악4개·컨트롤러·TownModelScene·스타일·index를 동기화했다. `hashes.json`은 제작 원본/웹/실행본 음원 및 변경 코드의 SHA256 대조다. 설치 프로그램은 재빌드하지 않았다. 이미 열려 있는 게임은 새로고침/재실행해야 반영된다.
