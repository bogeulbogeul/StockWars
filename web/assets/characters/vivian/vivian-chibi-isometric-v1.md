# Vivian isometric chibi v1

Built-in image generation tool. Original deep teal apron retained; orange change cancelled by user.
Static placement proposal, not a separated rig or final in-room validation.
Room projection reference: ROOM_GRID {size:8,x:768,y:345,halfWidth:85,halfHeight:41}. Faces screen lower-right (+u). Full body allows counter foreground occlusion. Intended foot anchor: midpoint between soles; proposed single-cell standing footprint, actual placement and scale not yet verified.
Reference roles: character sheet = identity; room/counter = camera; rigging reference reviewed for production structure only, not copied for appearance.

## Generation prompt

Use case: stylized-concept. Asset: single full-body transparent-background isometric chibi NPC standing sprite, Vivian, for placement BEHIND an existing shop checkout counter.
Image 1: authoritative Vivian identity and outfit reference. Preserve dark plum side-parted chin-length bob, amber eyes, small gold stud earrings, ivory rolled-sleeve collared shirt, ORIGINAL DEEP TEAL apron with straps, cream blank name badge, pockets with pen/notepad, charcoal trousers, brown ankle shoes. Absolutely no orange apron.
Image 2: room CAMERA/PROJECTION reference only. Image 3: existing counter CAMERA and orientation reference only. Do not render either room or counter.
Draw one appealing chibi version of this adult shopkeeper with large head and compact body, approximately 3 heads tall as a proposal for this sprite only. Refined clean 2D cartoon/anime linework, simple readable colors and restrained cel shading; not pixel art, no painterly blur. Confident restrained friendly smile.
Camera: orthographic elevated isometric interior view, visibly see the top of the head, shoulders and shoes, matching room grid screen axes (85,41) and (-85,41), roughly 2:1 diamond ground projection. This is not an eye-level portrait. Turn her full body and face toward screen LOWER RIGHT along the (85,41) ground axis, three-quarter front view. Intended employee stands on rear upper-left side of the long counter, facing customers lower-right.
Pose: relaxed stationary shopkeeper, both feet planted close together in a compact single-cell footprint, arms slightly bent with relaxed hands close in front of waist ready to serve. Do not draw her interacting with an invisible object. Draw complete body including legs and feet so the separate counter can occlude her lower half later. Keep silhouette uncluttered, maintain anatomical hand readability.
Composition: one centered full-body figure only, entire hair and both shoes visible, clear margins, feet midpoint near lower center as placement anchor. True transparent alpha background, no floor tile, cast shadow, props outside outfit, furniture, labels, sheet, extra views or watermark.
This is a static placement design proposal, not a finished separated rig or globally finalized character proportions.

## Alpha cleanup prompt

Background-extraction edit ONLY. Preserve this exact Vivian chibi character completely unchanged: face, pose, plum hair, original deep teal apron, clothes, full body, proportions, camera, line art, dimensions. Remove ALL of the colored blurry halo/glow and ALL background around her silhouette, including the brown purple and teal haze and any shadow around feet. All pixels outside the crisp character silhouette must be fully transparent alpha=0. No matte, gradient, color spill, backdrop, shadow or glow. Maintain anti-aliased clean edges and opaque character interiors. Output single clean transparent PNG cutout.

