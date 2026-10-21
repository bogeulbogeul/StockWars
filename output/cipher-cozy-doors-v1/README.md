# 증권사 포근한 아치 양문·모양 간판 v1

사용자 참고의 크림색 아치틀·파란 양문·둥근 손잡이·원형 모양 간판·벽등을 독립 Blender 에셋으로 제작했습니다.

- `Cipher-arched-double-door.blend/.glb`: 공통 양문과 벽등 두 개. 외곽 아치 폭 1.52, 높이 1.90.
- `Cipher-sign-training.blend/.glb`: 굵은 상승 막대 차트 원형 간판.
- `Cipher-sign-competition.blend/.glb`: 트로피 원형 간판.
- `door-sign-preview.png`: 경쟁룸 문/간판 조합 렌더.
- `game-doors.png`: 게임 배치 화면.
- 제작 스크립트와 `exterior_geometry.py`: 재제작용.

Blender Z-up, 정면 -Y이며 게임에서 100배로 설치합니다.
문은 기존 양쪽 측면 벽 좌표, 간판은 각 문 위 중앙 높이 239를 유지합니다.
모델별 배경·스튜디오 조명은 GLB에 포함하지 않습니다.
현재는 정적인 문 외형이며 F키로 기존 트레이닝/경쟁 UI를 엽니다. 별도 여닫힘 애니메이션은 추가하지 않았습니다.
게임/실행본에 설치했고 로비 회귀·양쪽 시설 왕복을 검증했습니다. 나가는 입구는 변경하지 않았습니다.
