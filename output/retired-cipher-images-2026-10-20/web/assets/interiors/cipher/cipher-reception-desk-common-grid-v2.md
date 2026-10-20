# 안내 데스크 새 그리드 수정본

- 도구: built-in imagegen, 투명 PNG.
- 디자인 참고: common-grid-v1, 기존 크림/남색/금색과 상승 차트 문양 유지.
- 본체 점유: 1×3. 전체 배치 점유는 직원 뒤 공간을 포함하여 2×3 유지.
- 높이 제안: 54 기준 단위. 캐릭터 기준 H=90의 0.60배.
- 목표: 상판, 중간 금색 띠, 밑판 모두 ±29.50664658° 정사영 평행선.
- 상태: 생성 시안. 게임 적용/접지 검증과 최종 채택은 아직 수행하지 않음.

## 최종 수정 프롬프트

Precise geometry correction to this reception desk PNG. Preserve the exact cream/navy/gold design, chart emblem, clean polished illustrated shading, alpha background. The long edges are currently TOO SHALLOW (~24 degrees); redraw them to exactly 29.50664658 degrees (slope .5659259259), a visibly STEEPER long edge. Both axes have identical slope magnitude. Countertop, gold stripe, upper/lower navy rims all must use these same parallel axes; no perspective. IMPORTANT desk BODY footprint is 1x3, with staff space separately reserved behind it; long:short side ratio 3:1. Do not draw staff or laptop. Numeric silhouette on 1024-square canvas: TOP rear (700,120), left (92.5,463.8), front (295,578.4), right (902.5,234.6). Corresponding BASE corners are 324px straight down from these four corners. This fixes exact +29.5066 and -29.5066 angles. Preserve these points and proportions rather than copying the old image's angles. Full object visible with transparent padding, real transparent alpha, NO shadow/glow halo, no floor, no labels, no background. Raster illustrated game sprite, no SVG.
