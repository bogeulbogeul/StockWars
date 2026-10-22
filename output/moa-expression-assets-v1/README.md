# 모아 웃음·앉아서 졸기 3D 에셋

2026-10-21 사용자 정정에 따라 이미지 시안이 아닌 실제 모델 에셋을 제작했다.
원본은 `../anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend`다.

- `Moa-smile.glb` / `Moa-smile.blend`: 웃는 눈·열린 작은 입의 얼굴 텍스처. 기존 8개 클립 보존.
  - 2026-10-21 후속: 사용자 요청으로 소망이 `somangi-eating-face-v1`과 같은 중심(-.008, .278)·반지름(.034, .037)의 검은 단색 타원 입으로 수정했다. 웃는 눈을 유지하고 붉은 입 안쪽 색은 제거했다. Blend·GLB·텍스처·정면/측면 렌더를 갱신하고 재임포트 검증했다. 졸기 에셋은 그대로 유지한다.
- `Moa-doze.glb` / `Moa-doze.blend`: 감은 눈·작은 입의 얼굴 텍스처. 기존 8개 클립과 `Seated_Doze` 추가.
- `Seated_Doze`: 기존 지면 앉기 자세에서 머리 6~18도·잎의 느린 끄덕임. 32fps, 1~129프레임, 4초 반복. 잎 움직임을 포함하므로 이 클립 재생 중 `Leaf_*` 클립을 중첩하지 않는다.
- 각 표정 텍스처는 해당 GLB에 포함된다. 표정별 별도 모델이며 한 모델 내 표정 전환 시스템을 추가한 작업은 아니다.
- `doze-preview.gif`: 실제 Blender 모델 동작 렌더. `smile-front.png`, `doze-front.png`, `doze-side.png`: 실제 에셋 정적 렌더.

✅ 모델 좌표·조끼·체형 보존, 실제 GLB 재임포트 6메시 및 8/9개 클립 확인, 졸기 반복 양끝 본 행렬 일치 검사. 상세는 `validation.json`.
## 게임 반영 — 2026-10-21 후속

✅ 웹 및 로컬 실행본 반영. `Moa-bench-doze.glb`는 기존 `anna-size-sit-match-v1`의 `Bench_Seated` 자세와 좌석 높이 0을 유지하며 `Seated_Doze`를 추가한 게임용 모델이다. 지면 앉기 GLB를 벤치에 그대로 올리지 않는다.

게임은 `web/assets/characters/3d/anna/bench-doze.glb`와 `smile-basecolor.png`를 사용한다. 정류장 모아가 4초 반복으로 졸고, 소망이가 수평 거리 130 안으로 오면 앉은 자세에서 웃는 표정으로 깨어난다. 거리 170 밖이면 다시 졸며 경계에서 반복 전환하지 않는다. 졸기 중 기존 코드의 머리 회전 덧셈을 제거해 클립과 중복하지 않는다. 기존 수면 표시도 깨어 있을 때 숨긴다.

`scratch/check-moa-motion.cjs`로 웹·실행본 각각 GLB/텍스처 로딩, 머리 끄덕임, 4초 루프, 접근/이탈·경계 상태 유지, 표정 복원, 벤치 높이 오차 0, 브라우저 오류·에셋 요청 실패 없음 확인. 게임 렌더러의 모델·표정 캡처도 확인했다. 설치 프로그램은 재빌드하지 않았다.

⏳ 사용자 최종 시각·실제 플레이 접촉 검수. 기존 원본과 이전 bench-sit 에셋은 보존한다.

재생성: Blender에서 `build.py`, 검증: `verify.py`. 앞서 생성한 `../moa-smile-v1/`, `../moa-dozing-v1/` PNG는 이미지 시안 이력이며 이 3D 에셋의 원본이 아니다.
