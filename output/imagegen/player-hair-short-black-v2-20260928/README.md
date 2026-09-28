# 검은 숏컷 헤어 보정 및 재합성

## 결과

- 선택 수정본: hair_short_front_idle_down_v3.png
- 중간 후보: hair_short_front_idle_down.png (옆머리 가림이 남은 파일)
- 사용 도구: 내장 image_gen으로 앞 헤어만 3단계 수정. 검수 시 기존 원본 레이어들을 직접 겹쳐 비교했으며 생성형 합성 이미지를 근거로 사용하지 않음.
- 기준 문서: 최신 ART_STYLE_GUIDE.md, part_separation_guide_512.md v3.1. 사용자 지정 검정색 우선.
- 정수리 덮개 위치를 높이고 앞머리 길이와 안쪽 옆머리를 줄임.
- 기존 뒤 헤어 파일은 그대로 재사용: ../player-hair-short-black-20260928/hair_short_back_idle_down.png
- 몸체·얼굴·의상·신발 원본은 수정하지 않음.

## 검수

| 항목 | 기존 | 수정본 |
|---|---:|---:|
| 왼쪽 눈 마크 가림 | 55.8% | 0.0% |
| 오른쪽 눈 마크 가림 | 58.5% | 0.0% |
| 전체 얼굴 마크 가림 (눈썹·입 포함) | 60.3% | 0.0% |
| 상부 두피 ROI 헤어 피복률 | 88.9% | 96.4% |

알파 128 이상 기준. 상부 두피 ROI x320..902/y243..440은 이마 일부도 포함하므로 피복률 100%를 요구하지 않음. 비교 이미지에서 정수리의 피부 띠 제거를 확인함. 위 수치는 파일을 자동 정렬하지 않고 좌상단 (0,0)에 그대로 겹쳐 계산함.

- 비교 이미지: review-contact-sheet.png (왼쪽 기존 / 오른쪽 보정, 50% 최근접 표시).
- measurements.txt: 세부 수치.
- 여전히 최종 제작 정리 필요: 수정본 1221×1288, 몸체 1222×1287로 캔버스가 각각 1px 다름. 최종 공통 캔버스 통일 시 원점을 유지하고 내용을 재중앙정렬하거나 늘리지 않아야 함.
- 반투명 픽셀과 미세한 색 변화가 남아 있음. 게임용 픽셀 격자·팔레트·알파 정리, 실제 표시 크기 검증은 미완료.
- 판정: 눈 가림/정수리 틈 보정은 개선 확인. 최종 게임용 에셋 확정은 아님. 의상과 신발의 이전 검수 문제는 별도 작업 대상.

## 수정 프롬프트 1 — 앞머리 길이와 정수리
EDIT image 1, the black front hair overlay, to fix failed registration. Keep exact full canvas 1222x1287, transparency, front/down idle, chunky tousled BLACK short hairstyle and one small cowlick. Image 2 is the exact bald head registration; image 3 is exact face overlay; image 4 is required cozy SD pixel style; image 5 shows the current WRONG assembly in panel A (skin above crown and bangs covering eyes).
Output ONLY corrected front hair PNG, no face/skin/body/text.
CRITICAL SHAPE CHANGES, substantial not subtle:
1. Build a full higher crown cap. Bald crown in image 2 starts at y243, so the hair arc MUST begin around y185 at center and completely cover the upper scalp. Fill the area directly below cowlick and above old crown to make a thick continuous hair cap; no transparent gaps exposing the scalp. Cap spreads left/right to enclose head upper contour.
2. Give this hairstyle a SHORT FRINGE ABOVE EYEBROWS. Raise the entire fringe edge by roughly 160px from its current long shape. Across x410..815, all bangs must end ABOVE y475. Remove long central downward spike; replace it with short chunky uneven locks ending y440..470. Large continuous transparent face opening starting at y480 across x410..815, down to bottom. BOTH FULL EYES and eyebrows must stay exposed, including all white eye highlights. Eyes live y545..665. Do not reproduce face pixels.
3. Short temple side locks may remain only OUTSIDE x410..815 below y475, and end at y665. Keep small tousled side tips, no bob curtain and no long hair.
Maintain dark plum-black outline, black base, charcoal shadow and restrained dark-gray upper-left highlight. 3 flat hair tones plus outline, crisp square pixel clusters, consistent coarse grid near 16px enlarged source pixels, one source-pixel colored outlines. Approximately two-head-tall SD character compatibility; slight top-down RPG camera, front-facing, not isometric. No gradients, texture, smooth highlights, antialiasing, translucent edge, blur, dithering, 3D or fine hair strands. True transparent background. No skin, eyes, eyebrows, mouth, ears, neck, clothes, body, accessories, watermark, text or frame. The face opening MUST be transparent, not filled black. Keep all below y680 empty.

## 수정 프롬프트 2 — 위치 보정
Apply exactly ONE geometric edit to this transparent PNG: TRANSLATE THE ENTIRE EXISTING HAIR 110 PIXELS UP. Keep canvas 1222x1287 unchanged. Do NOT redraw or rescale the hair, do NOT alter its shape or color. Every visible hair pixel moves from (x,y) to (x,y-110); clear its old location. This is registration correction, not haircut redesign. The little top cowlick now around y200 must be around y90, main crown around y295 becomes y185, fringe around y580 becomes y470, side tips around y740 become y630. Leave everything else transparent. Preserve black short cozy SD pixel hair, dark plum one-source-pixel contour, flat three-tone charcoal highlights and upper-left lighting, coarse crisp grid, front/down slight top-down view for two-head-tall character. No antialiasing, interpolation, smoothing, gradients, extra pixels, body, face, skin, ears, text or background. Image already contains only front hair overlay. Preserve genuine alpha transparency.

## 수정 프롬프트 3 — 눈 바깥쪽 옆머리
Edit this front hair overlay with ONE local shape correction: trim the two inner SIDE LOCKS away from eyes. Preserve upper crown/cowlick/fringe exactly as they are now. Preserve current position, black short haircut, charcoal tones, coarse pixel style, top-down front idle. Do not shift the hair again.
On the 1222x1287 full canvas, make rectangles x410..565,y530..675 and x657..810,y530..675 completely TRANSPARENT. These are protected eye areas. Remove the hair intruding into these rectangles, redraw a tidy one-source-pixel dark plum contour just OUTSIDE them as needed. The low side locks should now lie only to the left of x410 or right of x810 when below y530; if necessary end the inner temple tips at y520. Preserve outer side silhouette and all upper bangs, so this remains same haircut, not a different style. No new face or skin. Full canvas must be exactly 1222 wide, 1287 high with origin unchanged; do not scale existing pixels to achieve canvas size.
Only black hair on transparent background. Opaque hair pixels, flat black/charcoal/dark-gray three-tone shading and upper-left light, crisp square steps no gradients, antialiasing, texture, blur, translucency, dithering, 3D, thin strands. No eyes, face, ears, neck, body, text or other objects.

