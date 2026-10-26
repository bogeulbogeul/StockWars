# 증권사 평기와 크기·두께 통일 v11 — 2026-10-25

사용자 요청 “지붕 블럭의 크기 두께를 일정하게 유지해줘”에 따라 v10의 직사각형 크기와 배열은 유지하고 두께/표면 돌출을 실제 지붕 경사면에 수직인 치수로 통일했다.

- 배치 간격: 표면 기준 0.280×0.200, 줄눈 0.005. 온전한 평기와는 0.275×0.195.
- 모든 평기와 두께: 경사면 수직 방향 0.018. 지붕 위 돌출: 같은 방향 0.009. 베벨은 0.003으로 유지한다.
- 기존의 수직 Z 방향 압출은 경사에 따라 실제 두께가 달라졌다. 각 면의 법선을 계산해 수직 압출값을 보정하고, 베벨 적용 후 정점을 법선으로 투영해 각 기와의 실제 두께를 검사한다. `tile-thickness-validation.json` 참고.
- 외곽과 지붕 교차선의 조각은 경계에 맞춰 절단하며 같은 두께를 유지한다. 용마루는 앞선 시안형 별도 단면을 유지한다.

제작 `build.py`, 편집 원본 `CipherSecurities-roof-reference.blend`, 모델 `CipherSecurities-clock.glb`.
렌더 `reference-angle.png`, `roof-detail.png`, `front-right.png`, `front.png`, `rear.png`, `junction-close.png`, `ridge-close.png`.
검증 `verify.py`의 온전한 기와 실측·기존 86개 부재 보존 검사, `check-junction.py`의 접합 솔리드 검사.

P1 (Major) · ✅ 평기와 두께 보정·실측 검사·실제 모델 렌더 / ⏳ 사용자 최종 시각 검수·게임 적용. 웹/기존 실행본은 교체하지 않았다.
