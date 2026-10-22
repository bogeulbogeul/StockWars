# 소망이 원본 팔 메시 분리 — 2026-10-23

P1 (Major) · ✅ 원본 표면 분리·GLB 재수입 검사·분리 미리보기 / ⏳ 사용자 확인.

입력은 직전 얼굴 보정 모델 `../somangi-face-smooth-v1/somangi-face-smooth.glb`다. 걷기 v2에서 새로 구성했던 배·캡슐 팔을 사용하지 않았다.

원본의 모든 표면 삼각형을 `Body`, `Arm.L`, `Arm.R` 세 메시로 배분했다. 팔과 몸통 사이의 표면 연결 거리를 기준으로 어깨 경계를 정했다. 원래 표면 정점의 위치 이동은 0이며 원래 면의 UV·재질·커스텀 법선을 복사했다. 몸통과 팔의 잘린 단면에만 중앙 정점 총 4개와 마감 면 총 400개를 추가했다. 평활화·리메시·체형 재구성은 하지 않았다.

- `somangi-arms-separated.glb`: 정위치의 몸통·왼팔·오른팔 3개 메시.
- `somangi-arms-separated.blend`: 편집본.
- `somangi-arms-separated-front.png`: 합쳐진 상태의 실제 GLB 렌더.
- `somangi-arms-separated-exploded-front.png`: 분리 확인을 위해 렌더 장면에서만 양팔을 옆으로 이동한 이미지. 저장 모델에서는 원래 위치를 유지한다.
- `validation.json`: 원본 면 79,282개의 누락·중복 배분 없음, 원래 정점 이동 0, 재수입 검사.

이 파일은 메시 분리용 정지 모델이다. 새 리깅·걷기 모션·게임 적용은 포함하지 않는다. 후속 걷기 제작 시 이 원본 팔을 그대로 사용할 수 있다. 마감은 절단 경계를 닫는 용도이며 회전 시 어깨의 겹침·접촉은 후속 리깅에서 확인해야 한다.

재현: Blender에서 `build.py`, `validate.py` 순으로 실행한다. `render.py -- somangi-arms-separated.glb`로 일반 렌더, 끝에 `--exploded`를 추가하면 분리 확인 렌더를 만든다.
