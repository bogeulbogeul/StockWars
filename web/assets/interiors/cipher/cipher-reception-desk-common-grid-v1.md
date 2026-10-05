# 새 공통 그리드 안내 데스크 제작 시안

- 생성 도구: built-in imagegen (투명 배경).
- 참고: cipher-reception-desk-logo-v3.png. 디자인과 소재만 참고하고 기존 투영은 교체.
- 목표 축: ±29.50664658°, 기울기 19.1/33.75. 원근 없는 정사영.
- 목표 점유: 2×3. 직원/NPC는 별도 에셋이며 데스크 뒤 공간은 별도 검증.
- 제안 높이: 54 기준 단위. 가구 높이 검증 시작값이며 최종 확정 치수가 아님.
- 바닥/그리드 보정 코드는 이번 작업에서 변경하지 않음.
- 상태: 미채택. 긴 상판 모서리가 목표 각도보다 완만하고 본체/직원 영역 구분이 부정확하여 수정본 제작으로 진행. 기존 가구를 교체하지 않음.

## 생성 프롬프트

Use case: precise-object-edit. Asset type: StockWars securities lobby reception desk, separate transparent PNG furniture sprite. Input image 1 is appearance/material reference ONLY, its old perspective must be replaced. Redraw ONE reception desk with cream panels, deep navy blue frame, narrow gold horizontal stripe, simple gold rising chart emblem centered on the long front face. Preserve its polished clean illustrated raster game-art feeling, readable outlines and subtle material shading, not SVG art. No character, laptop, floor, wall, grid lines, labels or halo. Truly transparent background, generous padding, complete object visible. Geometry: strict parallel orthographic isometric projection with ALL horizontal structural edges at exactly +29.50664658 degrees or -29.50664658 degrees to horizontal, slope 19.1/33.75. No perspective convergence, no rounding to 30 degrees. Long desk length 3 logical tiles and depth 2 logical tiles. Use one tile vectors (135,76.4) and (-135,76.4) at four times the base grid. On a 1024-square composition, ideal countertop structural outer corners are rear (400,120), right (805,349.2), front (535,502), left (130,272.8); base corresponding corners are exactly 216 pixels vertically below top corners. Desk height corresponds to 54 base units, a proposed 0.60 of the 90-unit character reference height. Rounded corners only very slight and do not change straight edge slopes. Gold stripe and upper rim and lower rim must have identical parallel angles; vertical edges truly vertical. Footprint is the 2x3 rectangle; staff space remains outside the sprite behind it. All countertop and base edges conform to same two axes. Make attractive high-resolution PNG with real alpha, no glow spilling beyond silhouette.
