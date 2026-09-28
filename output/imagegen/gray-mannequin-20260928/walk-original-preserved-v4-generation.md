# 원형 보존 걷기 시안 v4

내장 image_gen 사용. 원형: 사용자 제공 2026-09-28 20:31:26 이미지. 살구색 캐릭터는 자세만 참고. v2/v3는 참고에서 제외.

결과: mannequin-walk-original-preserved-v4.png

검수: 기존 형태와 회색 명암에 가까워졌으나 좌우 행 1·3번 발의 교대가 불충분하다. 검토용 시안이며 최종 게임 에셋으로 채택하지 않음. 웹 교체 없음.

## 프롬프트

```text
Edit image 1 very conservatively. It is the authoritative original gray mannequin. Preserve its exact character design, head shape, ear placement, proportions, torso, limb thickness, neutral gray palette, shading strength, highlight placement and outline weight. Change ONLY the arm and leg POSES needed for alternating walking. Do not redesign or recolor. Do not increase contrast or paint entire limbs dark. Keep all limbs the same material and natural existing subtle shading.
Image 2 is ONLY a skeletal pose reference: use its walking hand and foot positions, NOT its peach skin, face, eyes, anatomy, proportions, art style, lighting, UI or background. Image3 is project pixel-art reference only, subordinate to image1. Do not copy costumes.
Output a transparent PNG sheet in image1's 4 columns x4 rows arrangement. Row1 front/down; row2 left; row3 right; row4 back/up. Each row has step A, passing/neutral, opposite step B, passing/neutral. Match hand/foot poses from left/center/right columns in corresponding rows of image2 to output columns1/2/3, with neutral again in column4.
Crucial: the same near-side arm swings backwards when the near-side leg swings forward; when near-side leg swings backward, near-side arm swings forward. BOTH the hand and foot of each side swap positions between frames1 and3. Two distinct steps, not duplicates. Side-facing head direction stays fixed throughout each row. At left-facing frame3, keep the left-facing head from frame1 unchanged; do not mirror entire character to swap limbs. Same rule for right-facing. Gentle walk with grounded feet, no running leap.
Retain cozy SD crisp pixel clusters, same original head/body ratio, one-source-pixel dark outline, restrained three-tone gray shading with stepped upper-left highlights, slightly elevated 3/4 top-down RPG view. No exaggerated black far limbs, no purple body tint, no smooth gradients or glossy 3D, no added face/hair/clothes, no labels/grid/UI/text/watermark. Equal cell sizes, stable head and torso positions, shared baseline and scale. User explicitly prioritizes original character preservation over reinterpretation.
```

