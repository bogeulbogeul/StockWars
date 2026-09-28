# 4방향 걷기 시안 v6

내장 image_gen 사용. 사용자 지정 회색 원형과 신규 동작 참고 3장 및 프로젝트 기준 이미지 전달. 수정 시안 v2~v5는 입력에서 제외.

결과: mannequin-walk-4direction-v6.png

위에서부터 앞/왼쪽/오른쪽/뒤, 방향별 4프레임. 검수: 회색 외형과 비율은 원본에 가깝지만 좌우 1·3번 자세의 실질적 교대가 보이지 않으며 2·4번도 유사함. 동작 참고 반영 불충분. 최종 게임 에셋 미채택, 웹 적용 없음. 실제 재생 검증 안 됨.

## 생성 프롬프트

```text
Create a corrected FOUR-DIRECTION walk sprite sheet by editing reference image1. Preserve the original gray mannequin appearance exactly: same head shape and size, ears, blank face, torso shape, short limb proportions and thickness, gray palette, outline and subtle highlight/shadow strength. Do not change character design. ONLY limb poses change.
Reference roles: Image1 is the sole character appearance/master. Image2 is a walking mechanics reference (alternating contacts and passing legs) ONLY. Image3 is a direction/orientation reference ONLY: use cardinal front,left,right,back, not eight directions. Image4 is a walk timing/joint reference ONLY. Image5 is general project pixel-art context, subordinate to the original mannequin. Never copy any reference's colors, human proportions, clothing, text, diagrams, background, UI, or watermark. Do not refer to prior generated revisions.
Output square transparent PNG, exactly FOUR ROWS x FOUR COLUMNS =16 full-body sprites, uniform cells. Row1 FRONT facing viewer, row2 LEFT profile, row3 RIGHT profile, row4 BACK. Each row is four sequential walk poses: contact A, passing A, contact B (opposite anatomical foot), passing B. This is a full alternating walk cycle, not a two-frame repeated shuffle. Heads and torsos remain consistent across each row, same head direction and ear placement at every frame. Shared scale, cell centers and foot baseline, minimal bob.
Use the mechanics from images2/4: contact pose has feet apart, passing pose has support foot under hip and opposite bent knee passing. Half a cycle later the anatomical near and far legs trade forward/back positions. Arms counter-swing: near arm backward when near foot forward; near arm forward when near foot backward. Trace shoulder-elbow-hand and hip-knee-foot separately before rendering. RIGHT-facing row col1 near foot extends screen RIGHT while near hand extends LEFT; col3 near foot extends LEFT while near hand extends RIGHT. LEFT-facing row col1 near foot extends screen LEFT while near hand extends RIGHT; col3 near foot extends RIGHT while near hand extends LEFT. DO NOT mirror whole characters to swap foot contacts. Preserve head orientation. Do not repeat col1 in col3 or col2 in col4. Show differing bent knees in passing poses. Adapt human reference angles to the short original mannequin limbs without lengthening them. Both arms/legs stay original gray material, modest original occlusion shading only; no dark limb color coding.
Rendering: original cozy SD crisp pixel art, slightly elevated top-down RPG character view, consistent pixel density, dark neutral original outline roughly one source pixel, restrained three-tone gray shading with stepped upper-left highlights. No added face/hair/clothing, no blackened limbs, purple tint, muscle anatomy, glossy 3D, smooth gradient, glow, blur, dithering, text or grid. True transparent empty background, not black or checkerboard. Full sprites with margins. Preserve the original design while correcting movement, not redesigning the mannequin.
```

