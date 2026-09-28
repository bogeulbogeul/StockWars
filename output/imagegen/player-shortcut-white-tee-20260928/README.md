# 숏컷 · 흰 반팔 기본 외형 후보

- 생성 도구: 내장 image_gen
- 이미지: `idle_down-candidate.png` — 투명 배경, 정면 정지 외형 검증 후보 1프레임.
- 요청 복장: 검은 숏컷, 흰 반팔, 검은 반바지, 검은 신발.
- 참고: `Docs/ART_STYLE_GUIDE.md`, `Docs/part_separation_guide_512.md`, `Docs/References/player-compact-pixel-style-reference.png`.
- 육안 확인: 요청 복장, 간결한 얼굴, 유색 윤곽선과 단계형 픽셀 표현 확인. 생성 원본에는 미세한 색 변화가 있어 엄격한 공통 픽셀 격자·팔레트 검수 및 실제 게임 크기 검증이 필요함.
- 상태: 생성 후보. 최종 게임 에셋 채택 및 런타임 연결 안 됨. 생성 해상도는 런타임 규격이 아님. 4방향 이동 및 생활·상자 운반 모션 미제작.

## 생성 프롬프트

Use case: stylized-concept.
Create ONE complete StockWars character sprite, front-facing down/idle pose for a cozy modern life and stock-trading pixel RPG. Transparent RGBA background.
The attached image is STYLE REFERENCE ONLY: match its compact crisp pixel clusters, small simple face relative to readable clothing and body, chunky shapes and restrained palette. Do not reproduce the reference sheet, fantasy costumes, diagonal pose, background or UI.
Subject: a youthful adult with a neat BLACK SHORT HAIRCUT, plain WHITE SHORT-SLEEVE T-SHIRT, BLACK SHORTS ending above knees, and plain BLACK SHOES. Warm light peach skin. No accessories, no hat, no logos, no bag. Complete integrated appearance; no detached body parts.
Pose and camera: standing idle, facing directly toward screen bottom, arms relaxed with a little silhouette separation, both feet grounded at a shared baseline. Subtle three-quarter top-down RPG camera with some top of hair and shoulders visible, not a diagonal-facing character, not isometric, not strict overhead, not side-scroller. Full body centered with transparent margin.
Style: true low-resolution cozy SD pixel art enlarged with hard nearest-neighbor-like square pixel steps. Compact proportions like supplied reference, small face with tiny dark dot/short-line eyes and minimal mouth/nose; readable torso, shorts and bare lower legs. No giant anime eyes or oversized baby head. Chunky short hair locks. Consistent pixel density, one source-pixel dark brown/navy colored outlines. Three flat stepped tones per material, whites use ivory highlight and pale cool shadow; black hair/shorts/shoes remain near-black charcoal with subdued navy highlights. Upper-left light with crisp pixel-step shading. Keep shapes simple enough for small in-game display.
Only ONE character, ONE frame, no sheet, no captions, no checkerboard baked into image, no floor or cast shadow. No smooth gradients, antialiasing, airbrush, vector curves, painterly texture, dithering, glossy 3D, pixel-filtered 3D or watermark. Output is an initial appearance-validation sprite; the project's final runtime resolution remains undecided.
