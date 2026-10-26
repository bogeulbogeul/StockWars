# 글씨 없는 대사 UI 기본 요소 v1

2026-10-22 · P1 (Major) · ✅ 기본 요소 제작·게임 적용·브라우저 검증 / ⏳ 사용자 최종 플레이 검수

초상화 없는 마지막 대사창 시안을 참고하여 내장 imagegen으로 제작했다. PNG에는 글씨·초상화·게임 배경을 포함하지 않으며, 게임이 이름·대사를 동적으로 표시한다.

## 게임 반영 — 2026-10-22 후속 요청

- `web/assets/ui/dialogue-v1/`: 투명 PNG 41개 설치. 원본은 보존한다.
- `web/js/data/dialogueThemes.js`: 주민 9명과 소망·내레이션의 10색 매핑. 기존 내부 ID와 이전 이름도 지원한다.
- `web/js/components/dialogue/dialogueTheme.js`: 대화 컨테이너에 공통 이미지·색상 속성을 적용한다.
- `web/css/modules/dialogue/`: 패널 9-slice, 이름표, 선택 버튼, 모바일 일반 대화창 배치를 담당한다.
- 모아 일반 대화·튜토리얼, 봉봉 환영·상점 대화, 토리 대화·증권사 안내에서 초상화 DOM을 제거했다. 다른 주민의 미구현 대화·시설 기능을 새로 개방하지 않는다.
- 현재 3D 증권사 로비의 데스크 앞에서 F 또는 안내 버튼으로 기존 토리 대화를 연다. 이전 2D 로비를 열지 않고 기존 질문·의뢰·연습 대결 콜백을 재사용한다. 대화 중 이동을 막고 Esc·대화 마치기로 복귀한다.
- 관련 자동 테스트 36개 통과. 실제 Edge 브라우저에서 10색·40개 테마 이미지 로딩, 초상화 제거, 대화 선택, 튜토리얼 화자 전환, 3D 로비 F 진입·Esc 종료, 봉봉 상점, 일반 대화창 모바일 글자 크기·화면 경계를 검증했다. `game-validation/`에 스크린샷과 결과를 보관한다.
- 웹과 로컬 실행본의 해당 UI 파일·에셋을 동기화한다. 설치 프로그램은 재빌드하지 않는다. 사용자 최종 플레이·아트 검수는 별도다.
- 로컬 실행본의 오래된 UI 비표시 시작·진입 조건을 현행 웹의 3D 시작 구성과 맞췄다. 누락되어 있던 튜토리얼 하위 모듈·공통 월드 CSS·현행 포장 의존 파일 11개를 웹 원본에서 복사했다. 새 노동 기능을 구현하거나 폐기한 물류 기능을 복원한 작업은 아니다. 최종 웹과 실행본 리소스 양쪽에서 동일 브라우저 검증이 통과했으며 실행본 결과는 `game-validation-local/`에 보관한다.

## 기존 대사 UI 스타일 제거 — 2026-10-22 추가 요청

후속 배치 요청: 대사창은 화면 아래, 실제 선택지는 대사창 바깥 오른쪽 위에 세로로 배치한다. `dialogue-placement.css`가 일반 대화·의뢰·튜토리얼 선택·봉봉 상점의 공통 배치를 담당하며, 긴 목록은 선택지 영역만 스크롤한다. 데스크톱과 모바일에서 패널과 선택지의 좌표·화면 경계 및 기존 클릭 동작을 브라우저로 검증한다.

사용자가 대사와 배치를 다시 작업할 예정이므로 기존 스타일을 지우도록 요청했다. `visual-novel.css`·`anna-dialogue.css`와 기존 모아 자동 측면 도킹 모듈을 삭제했다. 봉봉의 초상화·구형 말풍선 스타일, 토리의 런타임 주입 구형 스타일도 제거했다. 새 UI는 `dialogue-shell.css`의 최소 구조와 크레파스 요소만 사용한다. 튜토리얼의 상호작용 대상 표시는 `tutorial-focus.css`로 분리했으며 대사 데이터·선택지 콜백·진행·저장 로직은 유지한다. 스마트폰 메시지 등 다른 용도의 스타일과 제작 원본은 이번 대사 UI 정리 대상에 포함하지 않는다.

- `atlas.png`: 10행 × 4열 투명 PNG 원본. 행 순서는 아래 표와 같다.
- 캐릭터 폴더마다 `dialogue-panel.png`, `nameplate.png`, `choice-selected.png`, `next-arrow.png`.
- `common/choice-idle.png`: 중립 크림색의 미선택 버튼.
- `manifest.json`: 이름·목표 색상·각 파일 크기·원본 추출 좌표.
- `extract.py`: 생성 원본의 픽셀을 다시 그리거나 색을 바꾸지 않고 분리하는 스크립트.

| 폴더 | 캐릭터 | 강조색 목표 |
| --- | --- | --- |
| moa | 모아 | 세이지 `#BDD6A2` |
| bongbong | 봉봉 | 살구 `#FFB99B` |
| woody | 우디 | 꿀빛 목재 `#DCBA87` |
| tori | 토리 | 더스티 블루 `#A9BDD8` |
| chagok | 차곡 | 연금색 `#E9CD85` |
| doran | 도란 | 모브 `#D2A4BD` |
| boni | 보니 | 민트 `#A9D9CB` |
| sodam | 소담 | 라벤더 `#C6B4DB` |
| duri | 두리 | 하늘색 `#B6DAE9` |
| somang | 소망·내레이션 | 중립 크림 `#E8DDC9` |

대사창은 공통 아이보리 계열이며 이름표·선택 버튼·진행 화살표로 색을 구분한다. 색상은 UI 제안이며 캐릭터 외형 채택 상태를 변경하지 않는다. 본문 글씨 권장색은 `#4C2B1A`다. 생성 이미지의 종이 질감 때문에 실제 픽셀 RGB는 목표 HEX와 다르다.

41개 개별 PNG의 투명 영역·불투명 내부 존재를 확인했다. 게임은 패널의 40px 원본 테두리를 9-slice로 사용하며 이름표·버튼을 공통 표시 크기로 맞춘다. 원본의 종이 가장자리와 미세한 크기 차이는 보존했다.

## 생성 프롬프트 기록

내장 imagegen 사용. 입력 참고는 이 대화에서 채택 방향을 정한 초상화 없는 봉봉 대사 UI 이미지다.

Transparent production UI atlas; no text, numbers, portraits, characters or scenery. Warm thin brown crayon edges, rounded corners, subtle paper grain and clean opaque ivory interiors. Exactly ten rows, four columns: separate blank dialogue panel, colored blank nameplate, colored selected-choice pill, downward triangle. Transparent gutters, matching geometry across rows. Row accent targets in order: sage #BDD6A2, peach #FFB99B, honey #DCBA87, dusty blue #A9BDD8, gold #E9CD85, mauve #D2A4BD, mint #A9D9CB, lavender #C6B4DB, sky #B6DAE9, neutral cream #E8DDC9. Dialogue fill #FFF8EB. No attached tabs or embedded arrows; each element independently sliceable. Preserve the reference's restrained handmade rim and cream UI style.
