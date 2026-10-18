# 유럽토끼 — 방향별 꼬리 가림 v2

사용자 요청: 디자인 시트에 맞춰 꼬리 위치와 노출을 수정하되 기존 색과 강아지 기준 모션을 유지한다.

- 외형·가림 참고: `../rabbit-design-2026-10-17-v1/design-sheet.png`.
- 수정 원본: `../rabbit-dog-baseline-v1/rabbit/run/`.
- 정면·앞오른쪽 사선에서는 짧은 중앙 꼬리가 골반 뒤로 가려진다. 해당 걷기·중립 정지·운반·사선 앉기의 측면 돌출을 없앴다.
- 뒤 정지·뒤 걷기 4논리 항목은 중앙 골반 연결과 원본 픽셀을 그대로 유지한다. 정측면 신규 상태는 추가하지 않았다.
- 강아지 v9와 같은 10상태·19논리 항목·16고유 그림, 걷기 0→1→2→1/160ms, 운반 0→1→2→3을 유지한다.
- 초상화·정면 앉기와 뒤 방향은 변경하지 않았다. 게임 설치는 하지 않았다.

## 산출물

- `preview.html`: 왼쪽 수정 전 토끼 / 오른쪽 꼬리 가림 수정본. 같은 순서·속도로 재생한다.
- `rabbit/run/sprite-sheet-alpha.png`: 1280×4000, 320×400셀.
- `rabbit/run/manifest.json`: 정확한 좌표와 재생 구성.
- `rabbit/review-final.png`: 전체 자세 보드.
- `qa/*.gif`: 걷기·운반 160ms 루프.
- `palette.json`: 원본과 바이트 동일한 289색 팔레트.

## 편집 방법과 검증 범위

내장 image_gen으로 행동별 꼬리 가림 편집을 수행했다. 프롬프트와 원본 경로는 `generation.json`·`retake.json`에 기록한다. 네이티브 결과를 sprite-gen 컴포넌트 추출기로 분리해 `native-components/`에 보관했다.

색·팔다리 보존을 위해 생성 결과의 RGB나 다시 정렬된 몸을 최종 프레임에 덮어쓰지 않았다. 네이티브 결과의 꼬리 없는 실루엣을 참고하여 **꼬리 겹침 경계의 로컬 알파 마스크를 수동 등록·정리**하고 원본 프레임에 조합했다. `occlusion.py`의 윤곽 좌표와 `mattes/`가 이 수동 단계의 명시적 기록이다. 이는 새 동작 생성·리깅·프레임 재타이밍이나 공식 추출기의 대체 구현이 아니다.

`preservation-verification.json`은 전체 RGB 채널 변경 0, 남은 픽셀 RGBA 일치, 마스크 외 원본 동일, 뒤 4항목 동일, 팔레트 파일 동일과 좌표·재생 구성 보존을 확인한다. `export-verification.json`은 시트 조합·중립 공유·팔레트 포함·잘림을 확인한다. `preview-verification.json`은 VM에서 10상태의 그리기 경로 364호출을 검사한 결과다. 실시간 애니메이션의 연속성·게임 접촉 시각 검수 통과를 의미하지 않는다.

## 재현

sprite-gen 전용 venv Python으로 `occlusion.py` → `verify.py` → `verify-preservation.py`를 실행하고, Node로 `validate-preview.cjs`를 실행한다. 프레임 원본은 항상 v1에서 읽는다. `prepare.py`는 기존 프레임을 편집 입력 행으로 조합하고, `inspect-regions.py`는 좌표 검수용 확대판만 생성한다.
