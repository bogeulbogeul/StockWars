# 유럽토끼 v5 — 꼬리 아래 고정 / 위쪽 미세 좌우 움직임

사용자 확정: 아래 연결부는 골반에 붙이고 위쪽 솜털만 접지 A에서 조금 왼쪽·중립 가운데·접지 B에서 조금 오른쪽으로 기울인다. 재생은 A→중립→B→중립, 160ms다.

`../rabbit-portrait-design-v4/`를 원본으로 뒤 걷기 접지 A/B 두 PNG의 위쪽 꼬리만 수정했다. 중립·뒤 정지·초상화를 포함한 다른17논리 항목은 PNG 바이트 동일하다. 두 접지에서 꼬리 아래 연결부(y256 이후)는 RGBA가 원본과 동일하며, 몸·손발·외곽 알파·색 목록·좌표·재생 구성을 유지한다. 정면·사선 가림도 그대로다.

내장 image_gen으로 아래 연결부를 유지한 좌/중앙/우 꼬리 행을 편집했다. 프롬프트·원본은 `generation.json`, 공식 sprite-gen 컴포넌트 추출과 연결점 등록은 `prepare.py`에 기록한다. 네이티브 A/B 위쪽만 원본에 조합하고, 경계의 짧은 조합 구간과 아래쪽 원본 보존을 명시했다. 색은 기존 꼬리 RGB만으로 공식 `recolor` 베이크했다. 리깅·런타임 꼬리 파츠·전체 꼬리 회전으로 대체하지 않았다.

- `preview.html`: v4/v5 뒤 걷기 동시 비교. 모든 상태 선택 가능.
- `rabbit/run/sprite-sheet-alpha.png`, `manifest.json`, `frames/`: 수정본 전체 시트와 정확한 재생 구성.
- `tail-contact.png`: 세 자세 꼬리 확대 검수판.
- `qa/up_walk.gif`: 기존160ms 재생 파일.
- `verification.json`: 다른17PNG 동일·아래 연결부 동일·모든 알파 동일·공통 팔레트 동일·시트/프레임 일치 검사. 위쪽 밝은 털의 중심이 A < 중립 < B인지 수치 검사했다.
- `preview-verification.json`: VM 그리기 경로 검사. 라이브 모션 연속성 검수는 아니며 걷기 상태는 experimental로 기록한다.

사용자 후속 요청으로 게임의 `web/assets/characters/forest-friends/european-rabbit/`에 설치했다. 상점·플레이어가 같은 시트를 사용하며 토끼 높이90과 얼굴 크롭을 맞췄다. 설치 PNG 원본 동일·다른 숲속5종 유지와 회귀18검사를 확인했다. `game-installation.json`을 따른다. 실제 플레이 접촉·라이브 모션 시각 검수는 별도다. 공통 문서의 후속 기준도 아래 연결부 고정 + 위쪽만 미세 기울임으로 갱신했다.

재현: sprite-gen 전용 venv Python으로 `prepare.py` → 공식 `sprite-gen recolor`로 `upper-tail-patches.png`와 `recolor-spec.json`을 `baked/`에 베이크 → `publish.py` → Node로 `validate-preview.cjs` 실행.
