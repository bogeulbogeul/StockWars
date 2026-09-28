# 4방향 idle 초안

## v2 수정

- 최신 파일: `idle-four-directions-v2.png`.
- 사용자 요청에 따라 재생성 없이 원본 픽셀 직접 수정. 오른쪽 하단 627×627 셀을 왼쪽 하단 셀의 정확한 수평 반전으로 교체.
- 정면·후면 손 내부의 검은 점 4개를 인접 피부색으로 제거. 측면 손에는 해당 검은 점이 없음.
- 저장 결과 좌우 셀의 반전 비교에서 RGBA 불일치 픽셀 0개 확인. 투명 배경 유지.
- 이번 사용자 요청은 광원 재계산보다 정확한 좌우 반전을 우선함. 원본 PNG 보존.

- 도구: 내장 image_gen. 기존 정면 캐릭터 및 공식 화풍 참고 이미지를 전달해 생성.
- 파일: `idle-four-directions.png`, 투명 RGBA PNG.
- 배치: 2×2. 좌상 down, 우상 up, 좌하 left, 우하 right. 방향별 정지 1프레임, 시간 변화 애니메이션 없음.
- 외형: 검은 숏컷, 흰 반팔, 검은 반바지, 검은 신발.
- 검수: 4방향과 요청 복장, 정지 자세를 육안 확인. 측면과 정면의 높이 차이 및 행별 접지점 정렬 보정이 필요함. 공통 픽셀 격자·팔레트와 실제 게임 표시 크기 미검증.
- 상태: 시각 초안. 최종 게임 에셋으로 채택하거나 런타임 연결하지 않음. 생성 이미지 크기와 2×2 배치를 공통 런타임 규격으로 확정하지 않음.
- 걷기와 생활 모션은 이번 제작 범위에서 제외.

## 생성 프롬프트

Use case: identity-preserve. Create a FOUR DIRECTION IDLE SPRITE SHEET of the exact character in reference image 1, with image 2 as supporting StockWars pixel-art style reference. Preserve character identity, black short chunky haircut, light peach skin, plain white short sleeve T-shirt, above-knee black shorts, black shoes, compact SD proportions, tiny line eyes, and overall appearance. All are complete clothed character frames.
One square transparent RGBA sheet, strictly 2 columns x 2 rows, four equal square cells, no lines or labels. TOP LEFT: down idle (front toward viewer). TOP RIGHT: up idle (back fully toward viewer, no face visible). BOTTOM LEFT: left idle (character looking screen-left). BOTTOM RIGHT: right idle (looking screen-right). Exactly four figures, exactly one standing still frame per direction. Relaxed arms, stationary feet, no walking stride, no props. Keep each character same scale, same total height, same proportions, same source pixel density. In each cell the character centered at 50% width, shoe soles at 85% cell height, hair top near 18% cell height, ample transparent margins; align both rows identically in their cells.
Cozy SD pixel art with small face and readable clothing like the references. Subtle three-quarter top-down RPG CAMERA for all four cardinal facings, show hair crown and shoulder tops, NOT diagonal isometric facing or side-scroller camera. Crisp square pixel clusters, hard pixel steps, consistent single-source-pixel dark brown/navy colored outlines; three flat tones per material, restrained ivory and charcoal/cool navy colors. Upper-left lighting for every view (do not just mirror highlights). Fixed integrated face, no interchangeable parts.
No accessories, hat, logos, text, labels, grid lines, numbers, floor, shadows on ground or baked checkerboard. No blur, smooth shading, gradient, antialiasing, painterly texture, noisy dithering, vector curves, glossy 3D, watermark. Actual transparent background. This is only the idle four-direction sheet, no walk or other animations.
