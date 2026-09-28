# 플레이어 기본형 생성 후보

- 생성 도구: built-in image_gen
- 기준: Docs/ART_STYLE_GUIDE.md, Docs/part_separation_guide_512.md (2026-09-28), Docs/References/player-character-style-reference.png
- 결과: player_base_idle_down_candidate.png
- 범위: 정면(down) 정지 외형 1종, 기본 헤어·얼굴·의상을 합성한 디자인 참고 이미지.
- 검수: 파스텔 색감, 큰 눈, 유색 윤곽선과 픽셀 실루엣을 반영. 비율 보정 후에도 머리 대비 몸이 짧아 약 2등신 목표 추가 조정 필요. 균일한 원본 픽셀 격자·평면 팔레트·알파 경계는 제작 단계에서 정리해야 함.
- 상태: 디자인 참고용 후보. 최종 게임 에셋으로 채택하지 않음. 파츠 분리, 4방향, 걷기, 공통 좌표 정렬 및 실제 게임 표시 크기 검증은 미완료.
- 64×64 및 정확한 몸체 좌표/프레임 수/팔레트는 확정하지 않음. 생성 캔버스 크기는 게임 제작 해상도가 아님.

## 최초 생성 프롬프트

Use case: stylized-concept.
Asset type: StockWars player character base appearance candidate, single front/down idle sprite, for subsequent modular pixel-sprite production.
Input image 1 is a STYLE AND PROPORTION REFERENCE only. Match its cozy SD pixel art, very large head, tiny compact body, big readable eyes, chunky hair silhouette and deliberate pixel steps. Do not copy its animal ears, hats, costume ornaments, gray background, frame or lettering.
Create exactly ONE full-body neutral player character centered on a truly transparent square canvas, ample clear margin, both feet aligned on a shared ground baseline. Screen-down/front facing, slight three-quarter TOP-DOWN RPG camera showing a little top of head and shoulders, NOT diagonally turned. Approximately TWO heads tall including hair, short torso and very short limbs, huge head, big teal eyes, tiny mouth, minimal nose, peach skin. Short simple warm brown hair in chunky locks, readable bangs, no accessories. Simple cream short-sleeve shirt, muted light-blue shorts, plain muted brown shoes. Calm friendly neutral expression. Symmetric relaxed idle pose with small hands slightly separated from torso and both feet visible. This is a neutral common-body silhouette candidate, not a fashion illustration.
Crisp intentionally placed square pixel clusters with consistent coarse pixel density. A low-resolution game sprite presented at an integer nearest-neighbor enlargement, no extra high-resolution microdetails. One source-pixel dark brown/purple colored outlines. Three discrete tones per material, upper-left lighting with hard pixel-step shadow boundaries, pastel cream/peach/light-blue base and small teal eye accent. Restrained detail and clear silhouette at small game display size. Full opacity inside sprite and transparent background, no translucent edge pixels.
No ground shadow, floor, scene, text, labels, watermark, border, palette swatches, multiple characters, sheet panels, props, weapons, hats, animal ears, tail. No isometric diamond view, side-scroller camera, strict overhead camera, painterly texture, antialiasing, blur, smooth gradients, glossy 3D, pixel-filtered 3D, noisy dithering. Do not imply that generated pixels are already an aligned production layer template.

## 비율 보정 프롬프트

Edit image 1, the StockWars base sprite candidate. Image 2 is the required art style reference. Make ONE targeted correction: change proportions to approximately TWO heads tall. From crown (ignore small cowlick) to chin should take about half the character height; chin to shoe soles should take about the other half. Current head is too large relative to body. Redraw compact head and short torso/limbs to achieve that ratio, preserving the same brown short chunky hair, teal big eyes, peach skin, cream plain shirt, light-blue shorts and brown shoes. Keep cute SD proportions, not a realistically proportioned child. Keep front/down idle pose, slight top-down RPG camera showing head and shoulder tops, both hands clear of torso, feet aligned, centered full body with margin. Preserve crisp consistent coarse pixel clusters, one-source-pixel dark colored outline, discrete three-tone shading per material, pastel palette, upper-left light. Remove subtle gradients and texture so each pixel cluster is a flat color, no antialiasing. Genuine transparent background, hard opaque edges. No background, shadow, text, labels, ornaments, extra characters, blur, smooth vector or painterly shading, dithering or 3D. This is a design candidate, no production pixel dimensions are being finalized.

