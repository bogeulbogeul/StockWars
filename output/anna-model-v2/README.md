# 안나 색 경계 보정 v2 — 2026-10-20

조끼 입구·목·암홀·밑단의 실제 표면 굴곡을 따라 색을 재분할했다. 몸에 번진 초록색과 조끼 테두리의 크림색 누락을 정리하고 경계 정점의 색을 보간했다. 기본 몸색·조끼색·얼굴 모양은 유지한다.

- [GLB](Anna-rigged.glb): 색·얼굴·7본 포함 T자 모델.
- [Blender 편집 원본](Anna-rigged.blend).
- [실제 GLB 재수입 정면](reimport-front.png), [좌측](left.png), [우측](right.png), [후면](back.png), [사선](angle.png).
- `face-basecolor.png`: 기존 얼굴의 sRGB 전달용 텍스처. 내보낸 GLB에서 얼굴에 정점색이 중복 곱해지지 않도록 처리했다.

✅ 정면·좌우·후면·사선 렌더 확인. v1 대비 정점 좌표·본 위치·웨이트 동일 확인. GLB 재수입 후 7본·전 정점 웨이트·정점색 유지 확인. 색상은 몸/조끼 정점색과 얼굴 텍스처로 전달한다. 검증 결과는 `validation.json`, 경계 처리 기록은 `color-validation.json`이다.

재현: Blender로 `../anna-model-v1/refine-colors.py` 실행 후 이 폴더의 `verify.py` 실행. 기존 제공 모델과 v1 제작 이력은 보존한다. 게임 적용과 전체 동작 검수는 별도다.
