# 왼쪽 3자세 v8

내장 image_gen 사용. 첨부 3자세를 위치 참고, 지정 회색 원본을 외형 기준으로 전달.

결과: mannequin-left-three-poses-v8.png

검수: 3자세 가로 배열과 중립은 생성됨. 양 끝 다리 교대가 불충분하고 귀 위치가 원본 왼쪽 방향과 달라졌으며 흐린 주변부가 생김. 미채택 시안. 웹 미적용.

## 생성 프롬프트

```text
Create a single horizontal strip of THREE LEFT-facing gray mannequin poses. Image1 is the exact three-pose arrangement and limb-position guide ONLY. Image2 is the authoritative character appearance: use its second-row left-facing mannequin's exact gray head, ears, body proportions, short limb lengths and thickness, subtle gray shading and pixel outline. Image3 is supporting project pixel style only; no costumes. Do NOT copy the peach character's face, colors, proportions or rendering. Preserve the gray mannequin design.
Left sprite: first stride A. Center sprite: neutral standing, both feet together under hip, arms hanging down. Right sprite: opposite stride B. All three face LEFT with same head/ear orientation; do not mirror the entire character between strides.
Carefully transfer shoulder-elbow-hand and hip-knee-foot positions and overlap from corresponding image1 sprites while maintaining original mannequin dimensions. A and B must have opposing near-side limb positions: in A the near foot forward toward screen LEFT and near hand back toward RIGHT; in B near foot back toward RIGHT and near hand forward toward LEFT. Far limbs counterpose. Use the overlaps in the three-pose guide. Do not repeat the same stride. All limbs same original gray material, no forced dark color coding. No foot enlargement or limb lengthening.
Style: original cozy SD pixel art for slightly elevated top-down RPG, crisp pixel clusters, thin dark original outline, restrained three gray tones, stepped upper-left highlights. No gradient, glow, soft halo, 3D, noisy dithering or blur. Blank face, no hair/clothing/accessories. Transparent background. Three equal cells in a SINGLE ROW, identical scale and baseline, enough transparent margin around full sprites. No text, grid or decorations.
```

