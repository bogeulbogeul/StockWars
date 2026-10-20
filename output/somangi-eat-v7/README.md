# 소망이 먹기 v7 — 원본 미소 복원

기존 v6의 별도 U자 입 근사치를 제거하고 기본 얼굴의 원본 입 텍스처를 그대로 사용한다. 먹는 구간에만 원본 UV를 공유하는 작은 가림 메시와 입 모프를 표시한다. 나머지 구간에는 두 메시를 머리 안으로 숨겨 원래 미소를 보여 준다.

- `somangi-eat.blend` / `somangi-eat.glb`: 3초 Eat 클립, 기존 몸·팔·음식 모션 유지.
- `eat-front.gif` / `eat-side.gif`: 정면·측면 전체 동작.
- `eat-rest.png`: 복원한 원본 미소. 동일 조건 원본 렌더와 입 영역 픽셀 오차 0 (`mouth-comparison.json`).
- `validation.json`: 73프레임 배·발·팔 길이·루프 및 단일 Eat/입 모프 GLB 재수입 검사 통과.

게임 및 실행본 리소스의 eat.glb에 반영. 이전 제작 원본은 보존한다.
