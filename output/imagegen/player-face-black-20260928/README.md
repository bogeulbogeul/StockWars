# 검은 눈 기본 얼굴 파츠

- 파일: face_default_idle_down.png
- 도구: 내장 image_gen (생성 후 위치 보정)
- 사용자 요청 우선: 문서의 청록색 눈 대신 검은 눈동자 적용.
- 포함: 눈썹, 검은 눈동자와 흰자, 흰색 하이라이트, 작은 입.
- 피부·몸체·헤어는 포함하지 않는 투명 오버레이.
- 등록 기준: 사용자 첨부 몸체 PNG (1222×1287). 정면 정지 1프레임.
- 검수: 피부 없는 얼굴 파츠와 검은 눈 확인. 생성 이미지의 미세한 색 변화와 픽셀 격자는 게임용 정리 필요. 실제 선택창 크기 및 다른 파츠와 합성 검수는 미완료. 생성 후보이며 최종 게임용 픽셀 규격을 확정하지 않음.

## 생성 프롬프트
Create a transparent facial-feature-only overlay asset face_default_idle_down for StockWars. Image 1 is the exact registration template, not content to reproduce. Image 2 is required cozy SD pixel-art style reference. Image 3 is face expression/style reference only; override its teal eye color with BLACK as explicitly requested.
OUTPUT ONLY two eyes with whites, black irises/pupils, tiny white catchlights, two simple black eyebrows, and one tiny softly smiling muted reddish-brown mouth. No head, no skin, no body, no ears, no blush, no nose, no hair, no clothes. All spaces between and around facial marks fully transparent. One neutral friendly face, front/down idle, matching the slightly top-down view and roughly two-head-tall SD character design.
REGISTRATION: preserve image 1 full untrimmed canvas proportions (1222 wide by 1287 high), do not center a cropped face or fill canvas. The head center is approximately x=605 with crown y=240 and chin y=730 in image 1. Place eyes within lower half of that head: left eye area approximately x=450..550 y=530..635; right eye x=660..760 y=530..635. Eyebrows just above at y=500. Small mouth centered x=605 y=675, about 34 wide and 17 high. These are placement guides for this source image only. At other generated output dimensions preserve these normalized placements. Keep ample transparent space above and the entire lower half empty.
STYLE: coarse crisp square pixel clusters compatible with image 1's approximately 16-pixel enlarged source grid. Not high-definition thin strokes. Large expressive open eyes but restrained detail. Black/charcoal iris and pupils, clearly white sclera, a small square white highlight in each upper-left iris. Dark plum-black colored outline one source pixel thick. Limited flat colors with at most three discrete tones per material, hard stepped edges, subtle upper-left light, no gradients, no texture, no soft edges, no antialiasing, no dithering, no painterly or vector look, no 3D. Avoid teal, blue, brown irises. No text, watermark, frame, background pattern, skin-colored fringe or shadow. Genuinely transparent RGBA background; opaque facial pixels. Produce a reusable facial overlay layer, NOT a composed character preview.

## 위치 보정 프롬프트
Edit image 1 facial overlay only. Maintain exact 1222x1287 canvas, transparent RGBA. Move ALL existing face marks (two eyebrows, two eyes, tiny mouth) UP by 110 pixels together, without changing their horizontal locations, sizes, shapes or colors. This places eye pixels around y=520..640 and mouth around y=670..700, inside the head of registration reference image 2. Image 2 is ONLY for alignment; do not include any of its head, skin, ears, body or outlines in the output. Image 3 is style reference. Output ONLY the translated eyebrows, eyes and mouth on transparency. Keep black irises, white sclera and square white upper-left catchlights, dark plum-black contours, little muted reddish-brown smile. Cozy SD pixel-art overlay for front/down idle roughly two-head-tall character with slight top-down RPG view; crisp coarse consistent square pixel clusters, one-source-pixel colored outlines, flat limited tones, no antialiasing, gradients, texture, blur, shading halo, dithering or 3D. All non-face pixels fully transparent. No additional marks, labels, swatches, shadow, watermark. Do not recenter or crop the canvas. The LOWER HALF below y=710 must be completely empty.

