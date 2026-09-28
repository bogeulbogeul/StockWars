# 왼쪽 걷기 자세 시안 v5

내장 image_gen 사용. 원형은 사용자 지정 회색 시트. 빨강 팔다리 자료는 자세/겹침 참고 전용. 2열 3행 왼쪽 걷기 검증 시안으로 생성, 게임 프레임 규격 변경 아님.

결과: mannequin-left-walk-v5.png

검수: 중간 접지/통과 자세와 마지막 반대 다리 자세가 표현되었으나 중간 프레임에 비슷한 발 자세가 반복되고 원본보다 팔다리가 길어 보이며 주변 흐린 테두리가 생겼다. 미채택 시안, 웹 교체 안 함. 재생 검증 안 됨.

## 프롬프트

```text
Use case: precise-object-edit. Generate a six-pose LEFT-facing walk-cycle study of the original gray mannequin.
Image 1 is the authoritative character design: reproduce its LEFT-facing gray mannequin head, ear position, head/body proportions, torso shape, arm/leg thickness, original neutral gray palette, original restrained shading and highlight style exactly. Only re-pose arms and legs. Do NOT copy its repetitive walk poses.
Image 2 is the POSE AND OCCLUSION blueprint ONLY. Reproduce its six corresponding arm/leg joint configurations in the same 2-column x3-row reading order (top left, top right, middle left, middle right, bottom left, bottom right). Map its bright-red limbs to the mannequin's camera-near limbs and its dark-red limbs to camera-far limbs, but render all limbs in the ORIGINAL gray material of image1. Do not retain any red/dark-red/magenta/white coloring, graphic style, black-stick limb anatomy or UI from image2. Its head is not an appearance reference.
Image3 is general project pixel art context, no clothing or character design to copy; user's exact original gray mannequin overrides it.
Pose transfer is the main change. Near hand and near foot must point OPPOSITE horizontal directions at extended step poses. Follow the bright-red arm and bright-red leg in image2 through all six cells: they exchange screen-left and screen-right positions through the cycle. Preserve the individual joints and overlaps, rather than repeating one stride silhouette. All SIX heads face LEFT, same head outline, ear position, highlights, torso volume; never horizontally flip the entire character when switching feet. Use moderate walking stride adapted to original limb length, not stretching limbs to match the reference's longer body. Preserve original mannequin look, no dark limb color coding or exaggerated shading, no pose-induced redesign.
Transparent PNG, 2 equal columns x3 equal rows, one full-body gray mannequin per cell, consistent scale and baseline within equal cells, aligned heads with only minimal vertical bob. Crisp cozy SD pixel clusters, one-source-pixel dark neutral outline like original, three restrained gray tones and stepped upper-left highlights. Slightly elevated 3/4 RPG character perspective as original. No face, hair, clothes, accessories, text, labels, arrows, markers, borders, ground shadow, smooth gradient, glossy 3D, blur or dithering. Six-frame arrangement is this motion study only, not a change to the game specification.
```

