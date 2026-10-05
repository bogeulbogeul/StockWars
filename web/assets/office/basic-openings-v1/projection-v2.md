# 문·창문 투영 수정 v2

2026-10-05. built-in image_gen으로 v1 PNG를 수정했다.

전체 이미지를 -3.1도 회전했던 런타임 보정은 제거했다. v2에서는 세로 프레임을 수직으로 재제작하고, 수평 프레임과 패널의 목표 기울기를 -19.1/33.75로 지정했다. 창문은 오른쪽 벽에 좌우 반전하여 적용한다. 게임에는 균일 배율만 사용하며, 문 주변 광택은 외곽 클리핑으로 제외한다. 생성 선은 목표값에 대한 미세 오차가 있을 수 있으며 수학적 일치 보장은 아니다.

프롬프트: Correct projection, retain muted beige oak ivory teal design. Rebuild the drawing, do NOT rotate the whole object. All vertical edges perfectly vertical. All horizontal frame crossbars, upper/lower outline, inner panel edges parallel with slope -0.5659259259, angle -29.50664658 degrees. Orthographic left wall, no perspective convergence, no leaning or tilt. Similar canvas bounds, transparent background, no halo. Palette unchanged.

적용 파일: door-oak-v2.png, window-oak-v2.png. 게임 화면에서 세로선과 벽 프레임 방향을 비교 확인했다.
