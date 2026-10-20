# 사용자 채색 안나 리터칭 — 2026-10-20

사용자가 새로 제공한 `C:/Users/bogeu/Downloads/Anna.glb`(02:19 수정본)의 색과 UV를 기준으로 작업했다. 이전 자동 채색본을 덮어씌우지 않는다.

암홀 내부의 몸색을 정리하고 새싹 밑동의 밝은 누락을 기존 잎색으로 채웠다. 색상은 사용자 텍스처에서 샘플링했으며, Blender 재질 마스크를 기존 UV에 베이크했다. 조끼의 색 배치·기존 표면 질감·노멀/러프니스 맵·빈 얼굴을 유지한다. 본과 표정을 새로 추가하지 않았다.

- [리터칭 GLB](Anna-retouched.glb)
- [Blender 편집 원본](Anna-retouched.blend)
- [정면 재수입 확인](reimport-front.png)
- [겨드랑이 확대](armpit-after.png), [새싹 확대](reimport-sprout.png)
- [리터칭 색상 텍스처](basecolor-retouched.png)

✅ 원본 형상·UV 동일 검사, 재수입 후 색상·노멀·러프니스 텍스처 유지 검사. 세부 결과는 `validation.json`·`reimport-validation.json`에 기록한다. 다운로드 원본과 게임 파일은 수정하지 않았다.

재현: Blender로 `retouch.py`, 이어서 `verify.py` 실행. `input.blend`는 이번 사용자 파일의 확인용 사본이다.
