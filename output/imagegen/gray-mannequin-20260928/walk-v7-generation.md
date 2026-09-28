# 왼쪽 걷기 v7

내장 image_gen 사용. 원본 회색 시트 + 동작 참고 + 프로젝트 화풍 기준. 출력: mannequin-left-walk-v7.png

2×2, 순서 좌상→우상→좌하→우하. 다리 접촉 자세 A/B와 두 통과 자세가 구분된다. 머리 방향 유지. 원본 대비 자세별 다리 길이·발 크기 편차, 팔 교대/가림 및 접지 정렬 추가 확인 필요. 제작 후보이며 최종 게임 에셋 아님. 웹 교체 및 재생 검수 미실시.

## 프롬프트

```text
Create ONLY a LEFT-facing walk cycle of the gray mannequin in image1. Four sprites in a 2x2 square sheet, chronological reading order top-left A, top-right passing A, bottom-left B, bottom-right passing B. Transparent background.
Preserve the original gray mannequin from image1's second row: EXACT head silhouette, ears, proportions, short arm/leg length, body width, outline and neutral gray subtle shading. All heads face screen LEFT with ear on the right side of the head silhouette. Keep identical heads/torso in all cells, no design changes.
Image2 supplies joint and overlap information only, not style or colors. Image3 is general project pixel style reference only. No red color coding, no clothing, no face, no blackened far limbs.
Most important BOTTOM LEFT pose B: the CAMERA-NEAR LEG extends BACKWARD to screen RIGHT from the hip, and the CAMERA-NEAR ARM reaches FORWARD to screen LEFT from the shoulder. Far leg reaches screen LEFT underneath/behind near leg, far arm reaches screen RIGHT behind torso. Draw this B pose first mentally; it must not be the same contact silhouette/overlap as A.
TOP LEFT pose A: camera-near LEG reaches screen LEFT, camera-near ARM swings screen RIGHT. Far leg reaches screen RIGHT; far arm screen LEFT. This reverses the near limb locations from B. Never flip head or torso to create B.
TOP RIGHT passing A: near support foot below hip, far knee bent and moving forward, near arm returning through torso.
BOTTOM RIGHT passing B: far support foot below hip, near knee bent and moving forward, near arm returning through torso in opposite swing. Modest walking, not running. Constant limb lengths, no stretch. Visible knee bend and different overlaps identify the legs, not dramatic recoloring. Preserve original modest gray material shading.
Crisp cozy SD pixel clusters, original slightly elevated RPG view, dark one-source-pixel outline, restrained three-tone gray and hard stepped upper-left highlights. No glow, fringe, blur, glossy 3D, smooth gradients, dithering, labels or grid. Equal square cells, consistent centered body placement and shared foot baseline. The sheet is a motion test; do not add other directions.
```

