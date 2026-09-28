# 회색 마네킹 4방향 걷기 시안

- 도구: built-in image_gen
- 기준 이미지: mannequin-front-v1.png
- 결과: mannequin-walk-4direction-v1.png
- 재생: walk-preview.html (기본 6fps, 일시정지·프레임·속도 조절)
- 구성: 4행 × 4열. 행은 down / left / right / up. 각 행 왼쪽부터 4프레임.
- 상태: 모션 검토용 시안. 게임에 연결하지 않음.
- 검수: 16셀과 양측면·후면 표현 확인. 보정 후에도 일부 1·3프레임 자세가 유사하며 교차 보행의 명료함, 프레임 정렬, 알파 경계와 픽셀 밀도 추가 정리 필요. 최종 게임용 루프 품질을 보장하지 않음.
- 4프레임과 6fps는 테스트 설정이며 프로젝트 공통 규격 확정이 아님.

## 최초 프롬프트

Create a FOUR DIRECTION WALK CYCLE SPRITE SHEET of the gray mannequin from image 1. Image 1 is the PRIMARY identity and proportions reference: bald blank oval head, small ears, narrow simple torso, short neck, mitten hands, two legs, gray featureless toy body. Preserve these proportions consistently. Image 2 only supports pixel art styling; copy no clothes, hair or face. EXACTLY 16 full-body sprites on a square transparent canvas, precisely 4 equal columns x 4 equal rows. No cell lines, borders or text. Row 1 FRONT facing screen down; row 2 LEFT profile facing screen left; row 3 RIGHT profile facing screen right; row 4 BACK facing screen up, back of head and body visible. All four frames in each row face that row's direction. Four chronological looping walking poses left to right: 1 left leg forward/right arm forward; 2 passing pose with legs near center; 3 right leg forward/left arm forward; 4 opposite passing pose. Show distinct foot positions and alternating arm swing, not four duplicated idle poses. On side views feet point in walking direction and front/back limbs overlap naturally. On back view show nape and rear silhouettes, not a copied front silhouette. Blank head has no face in all views. Lock identical head size, limb lengths and overall body scale across all 16 cells. Each cell has centered root and fixed ground baseline at 88% of cell height; ample margin, no clipped feet. Very subtle one-logical-pixel walking bob only. Clean grayscale pixel art, charcoal outline, medium gray base, dark gray shadow and light gray highlight, FLAT solid pixel clusters with consistent logical pixel size. Matte, no smooth shading. IMPORTANT do not reproduce the reference's halo or haze. Fully transparent empty space, crisp opaque sprite boundaries, NO glow, NO shadow, NO gradients, NO checkerboard painted into image. No hair, eyes, mouth, garments, footwear, accessories, anatomical details, robot parts, muscles, scenery, text or labels. Simple featureless non-anatomical mannequin. This is a motion test sheet, not a polished 3D render. Exact uniform 4x4 grid.

## 보정 프롬프트

Edit this 4x4 gray mannequin walking sprite sheet. Keep its 16-cell uniform square layout, body identity, scale, gray colors and row order: front, left, right, back. Correct the WALK CYCLE and BACK ROW. In EVERY row use four distinct sequential poses: column1 left foot forward/right arm forward; column2 passing pose with feet nearly together and weight rising; column3 right foot forward/left arm forward (OPPOSITE of column1, do not duplicate); column4 opposite passing pose. Arms counter-swing naturally. All head silhouettes stay same size, no frame-to-frame morphing. Feet have a consistent ground baseline within each cell. For bottom row, make clearly REAR facing silhouette with nape and shoulder backs, back of mitten hands, heels toward viewer; remove front chest highlight from rear torso. Keep no face in any view. Exact left profile on second row and right profile on third row. Fixed world upper-left light in ALL rows, don't mirror lighting. Flatten all surfaces to opaque solid grayscale pixel clusters and hard charcoal outlines; remove edge halos, speckle, gradients and blur. Background truly transparent. One complete 4 rows x4 columns motion sheet, no text/grid lines/clothing/hair/anatomical details. Generous equal cell padding and no cropping.

