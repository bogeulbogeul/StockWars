# 검은색 기본 신발

- 내장 image_gen으로 생성한 정면(down) 정지(idle) 좌우 신발 한 쌍의 투명 파츠.
- 피부·다리·양말을 포함하지 않음. 사용자 요청에 따라 검정색 적용.
- 참고: 최신 아트 가이드, 파츠 가이드 v3.1, 사용자 첨부 몸체 및 문서의 캐릭터 스타일 이미지.
- 상태: 생성 후보. 검정색, 좌우 한 쌍, 피부 없는 레이어 확인. 발바닥 위치가 몸체보다 아래로 내려와 있어 합성 전 접지점 및 발목 크기 정렬 필요. 픽셀 격자·명암·알파 경계 정리와 실제 게임 표시 크기 검수 미완료. 최종 게임 에셋 미채택.
- 캔버스 여백은 보존하며 생성 해상도는 게임 최종 픽셀 규격이 아님.

## 생성 프롬프트

Generate StockWars shoes_basic_black_idle_down, ONE transparent modular footwear layer with exactly TWO matching plain BLACK low-cut shoes. Image 1 is exact body alignment template. Image 2 required cozy SD pixel-art style reference. Image 3 reference simple shoe design but replace brown with BLACK.
ONLY shoe pixels, no legs, skin, socks, body, clothing, face, hair or floor. Simple rounded-toe everyday slip-on shoes, low ankle opening, subtle dark sole, no logo, buckle, laces, white sole or decoration. Tiny compact shoes for approximately two-head-tall SD body, not realistic footwear product illustration.
Use full untrimmed 1222x1287 canvas matching image 1. Shoes occupy ONLY the body's feet positions near bottom: left shoe approximately x480..598 y1005..1085, right shoe x620..738 y1005..1085. Both soles share y1085 baseline. Keep transparent gap between shoes, center of pair x609. Cover template foot silhouettes without adding skin to output. These placement numbers are only this source image's guide, not final game pixel spec. Do not enlarge/recenter as an inventory icon; all upper 78 percent of canvas stays empty. Two shoes face screen-down/front, slight three-quarter top-down RPG camera showing top and front toes, same neutral idle stance as template.
Crisp cozy SD pixel art, coarse consistent square clusters matching roughly 16px source pixel enlargement of body, one-source-pixel very dark plum colored outlines. Black base, near-black shadow, restrained charcoal-gray highlight, three flat tones plus outline. Upper-left light rendered as hard stepped pixel boundaries. Restrained detail and readable silhouette. No gradients, texture, blur, antialiasing, semitransparent fringes, dithering, painterly strokes, vector shading, glossy 3D, isometric, side-view shoes, realistic proportions, ground shadow, text, watermark, border, swatches or checkerboard. Shoe interiors fully opaque, everything else genuinely transparent RGBA.
