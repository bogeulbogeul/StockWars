# 유럽토끼 v4 — 디자인 시안 기준 초상화

사용자 요청: 짧은꼬리 동물 규칙을 문서에 반영하고 토끼 초상화를 캐릭터 디자인 시안에 맞춘다.

## 외형

외형 참고는 `../rabbit-design-2026-10-17-v1/design-sheet.png`의 얼굴 초상화다. `reference/design-face.png`는 해당 구간을 그대로 잘라 참고 용도로만 사용했다. 내장 image_gen으로 베이지 배경을 제거한 초상화를 제작했으며 전체 프롬프트·네이티브 원본 경로는 `generation.json`에 있다.

디자인 시안의 긴 귀·크림 눈썹·세로로 긴 눈매·짙은 위쪽과 밝은 아래쪽을 가진 따뜻한 갈색 홍채·검은 동공·흰 눈빛·작은 삼각 코·부드러운 미소를 따른다. v3의 단색 홍채와 둥근 코 형태를 외형 기준으로 재사용하지 않았다.

공식 sprite-gen 컴포넌트 추출기와 균일 배율로 얼굴/귀만 320×400셀에 배치했다. 털·귀·윤곽·코는 이전 색 목록으로 베이크하고 **홍채는 네이티브 RGB를 보존**하여 제한된 중간색으로 누르면서 생기는 얼룩·단색화를 막았다. 기존289색 목록은 그대로 포함하고 홍채1909색만 공통 RGB 목록에 추가해 총2198색을 기록했다. 이는 다른 모션의 색을 변경한 것이 아니다. 초상화와 모든 모션이 동일한 공통 목록 안에 있음을 검사한다.

## 결과·보존 검사

- `preview.html`: v3/v4 비교. 초상화부터 표시한다.
- `face-icon.png`: 투명 얼굴 초상화.
- `rabbit/run/sprite-sheet-alpha.png`, `manifest.json`, `frames/`: 초상화 한 칸만 교체한 전체 시트.
- `verification.json`: 다른18논리 항목의 PNG 바이트 동일, 기존 좌표·순서·160ms 동일, 홍채 RGB 보존, 시트/프레임 일치, 잘림 없음.
- `preview-verification.json`: 10상태·364그리기 호출의 VM 동작 검사. 브라우저 라이브 모션 검수는 아니다.

걷기·운반·앉기·짧은 꼬리와 다른 동물은 변경하지 않았다. 게임 설치는 하지 않았다.

재현: sprite-gen 전용 venv Python으로 `prepare-portrait.py` 실행 → 공식 `sprite-gen recolor`로 `portrait-native-aligned.png`와 `portrait-fur-spec.json`을 `baked/`에 베이크 → `publish.py` → Node로 `validate-preview.cjs` 실행.

문서 반영: `Docs/ART_STYLE_GUIDE.md`, `Docs/part_separation_guide_512.md`, `Docs/DOG_SPRITE_BASELINE.md`의 「종별 꼬리 제작 규칙」과 `AGENTS.md` 참조를 갱신했다. 몸·손발은 강아지 v9, 꼬리의 외형·길이·연결·노출·작은 움직임은 종별 디자인 기준이다.
