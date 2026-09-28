# 회색 마네킹 정면 기본형

- 도구: built-in image_gen
- 결과: mannequin-front-v1.png
- 용도: 최신 사용자 체형 참고에 따른 회색 마네킹 비율 검토. 헤어·얼굴·의상 없는 정면 1종.
- 검수: 형태와 회색 마네킹 표현은 확인. 보정 후에도 주변의 흐린 광택과 면의 미세한 그라디언트가 남아 있어 디자인 후보로만 보관. 픽셀 격자·알파 경계 정리 전 게임 에셋으로 채택하지 않음.
- 기존 기획 문서는 변경하지 않음.

## 최초 프롬프트

Use case: stylized-concept. Create ONE neutral GRAY MANNEQUIN base sprite for a cozy top-down pixel life game, full body FRONT/down idle pose. Input image 1 (blue-haired character sprite sheet) is the PRIMARY reference for pixel density, slender compact SD body proportions and upright pose. Input image 2 is secondary project pixel-style reference only. Follow the first reference's longer torso and legs, not a huge baby head: approximately 3 heads tall as a visual starting point, no measurements or labels. Translate to an unclothed but completely featureless gender-neutral toy mannequin: blank bald rounded head, small simple ears, short neck, plain torso, simple arms and mitten hands, two separate legs and small bare mannequin feet. NO facial features, hair, clothing, footwear, jewelry, anatomical details, chest definition or genital detail. The body is a smooth abstract doll silhouette, not a realistic nude human. Matte grayscale only, medium gray base, light gray highlight, darker gray shadow, charcoal outline. Arms relaxed slightly outward to leave narrow transparent gaps from torso, hands around hips, symmetric neutral stance, feet on same horizontal baseline. Slight top-down RPG camera consistent with front-facing row of first reference, not diagonally turned, no isometric diamond. Deliberate crisp square pixel clusters, one source-pixel dark outlines, flat three-tone shading, upper-left light, low-resolution sprite appearance enlarged with nearest neighbor, consistent logical pixel grid. One centered character with generous transparent margin, full head and feet visible. Real transparent background. NO pedestal, ground shadow, other views, sheet, grid, text, borders, UI, props. NO realistic anatomy, muscles, joint balls, robotic panels, smooth vector art, painterly texture, gradients, antialiasing, blur, glossy 3D, dithering. This is a proportion exploration mannequin for user review, not final production animation.

## 보정 프롬프트

Edit the supplied gray mannequin image. Preserve its exact silhouette, pose, proportions and single front-facing full body. Make one targeted correction: remove ALL glow, halo, blur, translucent edge pixels and shaded background around the silhouette, replacing outside with fully transparent alpha. Flatten the mannequin to a strict FIVE COLOR grayscale pixel-art palette: charcoal outline, dark gray shadow, medium gray base, light gray highlight, and one intermediate gray. Every logical square pixel cluster is one uniform solid opaque color. No gradients, texture or reflective/glossy highlight. Preserve blank bald head and featureless mannequin torso, arms and feet. No face, hair, clothes, anatomy details, text, scenery or extra sprites. This must look like a clean low-resolution pixel game base sprite, not a glowing 3D doll. Do not add background checkerboard; actual transparency.

