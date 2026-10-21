# 안내소 양옆 아치 창문 v1

P1 (Major) · ✅ 창문 제작·벽 개구부 / ⏳ 사용자 검수·게임 적용

밝은 목재 아치 창틀·십자 창살·낮은 창턱·간결한 푸른 유리의 독립 GLB를 제작했다. 양쪽 옆벽의 y=-1.15, 하단 z=.92에 배치하고 실제 벽 메시를 아치형으로 뚫었다. 구석 90도와 연속 몰딩, 후면 창문 없는 벽은 유지한다. 기존 가구 통로와 떨어진 앞쪽 벽에 설치했다.

- `Office-arched-window.glb`, `Office-arched-window.blend`: 독립 창문
- `Office-side-windows-preview.blend`: 개구부 포함 최신 안내소 조합
- `room-preview.png`, `window-detail.png`: 전체/확대
- `build_windows.py`, `manifest.json`: 재현과 양쪽 개구부 레이 검사

유리는 바깥 풍경을 표시하지 않는 양식화된 불투명 푸른 재질이다. 실제 투명창·시간대 자연광·게임 적용은 아직 구현하지 않았다. 기존 룸 원본과 게임은 보존한다.
