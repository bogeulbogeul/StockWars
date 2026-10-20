# 안나 겨드랑이·새싹 뿌리 보정 v3 — 2026-10-20

사용자 지적에 따라 양쪽 암홀 내부 몸 표면의 잔여 초록색을 크림색으로 정리하고, 새싹 줄기 아래의 미도색 구간을 올리브색으로 채웠다. 암홀 외곽의 조끼 테두리는 초록색으로 유지한다. 기존 얼굴·몸 형상·본·웨이트는 유지한다.

- [GLB](Anna-rigged.glb), [Blender 원본](Anna-rigged.blend)
- [오른쪽 겨드랑이 확대](armpit-right.png), [왼쪽 겨드랑이 확대](armpit-left.png)
- [새싹 뿌리 앞쪽](sprout-close.png), [뒤쪽](sprout-back.png)
- [GLB 재수입 정면](reimport-front.png)

보정은 해당 정점의 색에 한정한다. `validation.json`은 대상 밖 정점색 보존 검사, `reimport-validation.json`은 형상/웨이트 동일 및 GLB 본·정점색 검사 결과다. 원본 및 v1/v2 작업본은 보존한다. 게임은 변경하지 않았다.

재현: Blender로 `../anna-model-v2/touchup-v3.py` 실행 후 `verify.py` 실행.
