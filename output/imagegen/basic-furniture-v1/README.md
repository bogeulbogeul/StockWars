# 기본 가구 생성 시안 v1

2026-10-05 · 내장 image_gen 사용. 최종 채택 및 게임 적용 전 시안.

책상 2×1, 의자 1×1, 침대 2×3, 수납장 2×1은 이번 제작의 목표 점유 칸이며 확정된 전역 규격이 아니다.

ROOM_GRID: 원점 (768,345), 축 (85,41), (-85,41), 8×8. 참고 룸: web/assets/interiors/vivian-grid-v2/room.png. 실제 룸 위 접지·상하 모서리 각도·점유·통로 검증은 아직 완료되지 않았다. 생성 이미지의 기울기 차이와 책상·수납장의 주변 반투명 광택이 남아 있어 최종 게임 에셋으로 채택하지 않는다. 원본 비율과 알파를 보존했다. 런타임 코드는 변경하지 않았다.

## 생성 프롬프트

Use case: stylized-concept. Create ONE standalone StockWars basic furniture game sprite on genuine transparent background. Temporary interior asset, not a final art-style decision. Clean readable illustrated surfaces, crisp dark teal contours, restrained warm wood and cream with muted teal accents, subtle solid shading; no watercolor, no pixel-art requirement. Reference room image is ONLY for interior camera axes and readability, not for copying walls or floor. Strict orthographic isometric projection with horizontal ground axes (+85,+41) and (-85,+41), slope magnitude 41/85=0.48235294 (25.75 degrees from horizontal), verticals exactly vertical. EVERY tabletop, shelf, frame, bottom edge parallel to these same axes at ALL heights, no perspective convergence. Ground footprint confined to specified cells; elevation above it is separate. Contact anchor is frontmost ground vertex (u=w,v=h), clear bottom contact, no floor tile, no backdrop, no grid, no text, no people, no extra surrounding items. Fully visible with generous transparent margins. Furniture long dimension along +u down-right, short dimension along +v down-left. No staff or NPC seat except separately requested chair; reserve one clear adjacent cell for interaction outside footprint, never draw passage.

### desk

A plain beginner wooden writing desk, cream drawer unit under one side and four straight supports, EMPTY tabletop, no computer or accessories. Occupancy w=2,h=1. User stands at v=h side; chair is a separate asset.

### chair

A single basic wooden chair with muted teal padded seat and plain backrest, four straight legs, no wheels. Occupancy w=1,h=1. Faces toward -v (up-right), backrest on +v side. Free access from +v side.

### bed

A simple single bed with wood frame, cream mattress, muted teal blanket and one cream pillow, plain low headboard at u=0 end. Occupancy w=2,h=3; bed length along +v, width along +u (override generic long-axis instruction). Free interaction strip at +u side.

### cabinet

A plain low wooden storage cabinet with two cream closed doors, small simple knobs, flat wood top, short feet. Occupancy w=2,h=1. Doors on +v front side, free interaction strip along +v. No books or extra decorations.

## 책상 배경 제거 수정 프롬프트

Edit the provided desk sprite ONLY to remove ALL surrounding beige glow, dark background, atmospheric halo and ground shadow. Genuine transparent alpha outside crisp silhouette AND through gaps under desk. Preserve desk shape, materials, colors, outline, exact camera and dimensions. Do not add any backdrop. This is a cutout game sprite.

