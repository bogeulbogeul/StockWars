# 의상 정리 작업 — 생성 시도 기록

내장 image_gen으로 반팔 및 신발 보정을 시도했다. 두 결과 모두 요청 좌표를 정확히 따르지 않아 최종 파츠로 채택하지 않았다. 기존 원본과 선택 헤어는 보존했다. 이후 사용자가 코드 보정을 승인하여 정리와 합성 검수를 완료했다. 최종 납품 내용은 DELIVERY.md를 따른다.

남은 작업: 반팔 어깨/밑단 정렬, 반바지 길이와 신발 접지 정렬, 공통 캔버스와 알파 경계 정리, 전체 합성 재검수. 기준은 ART_STYLE_GUIDE.md와 part_separation_guide_512.md이며 게임 해상도는 아직 미확정이다.

## 반팔 프롬프트
Edit image 1, the isolated white T-shirt layer. Image 2 is the exact body alignment template, image 3 the StockWars style reference. Return ONLY a white short sleeve tee on genuine transparent background, full untrimmed 1222x1287 canvas, preserving original horizontal positioning centered x611. Fix fit: move upper shoulders upward to y744, round neckline at x574..650 y748..784, cover shoulders, not a cold-shoulder garment. Shorten torso hem to y922 (old hem987), sleeve hems around y858, so hands stay visible and black shorts can be seen. Desired overall x435..789 y744..928. Do not draw body, skin, shorts, shoes, face or hair. Cozy SD pixel art for approximately two-head-tall body; front-facing down idle, slight 3/4 top-down RPG view matching body. Crisp chunky pixel clusters matching template scale, one-source-pixel dark plum outline, white/light lavender-gray 3-tone flat shading, light upper left. No gradients, antialias, noise, texture, dithering, 3D, text or checkerboard. Opaque garment interiors and transparent negative space. Preserve empty canvas and don't enlarge or recenter the garment.

## 신발 프롬프트
Edit image 1: isolated BLACK SHOES layer. Correct fit using image 2 body template. Image 3 is style reference. ONLY two black shoes on transparent full canvas 1222x1287, not cropped or centered on shoes. Make shoes shorter/flatter and move soles UP: existing bottoms y1129 must become y1085, aligned with body's feet bottom1080. Keep tops near y1000. Target left shoe x480..604,y1000..1086; right shoe x619..742,y1000..1086. Cover feet completely with small casual black low shoes; no legs, skin, body, socks, hair, clothes, face or extras. Front/down idle slight 3/4 top-down RPG view, approximately two-head-tall SD character compatibility, cozy pixel style, coarse square pixel steps matching body, one-source-pixel dark plum contour, three flat charcoal-black tones, restrained upper-left highlight. No laces detail, no text, no logos, no gradients, dithering, texture, blur, antialiasing or 3D. Pure alpha background and opaque shoe interiors. Preserve horizontal centers and blank upper canvas.


