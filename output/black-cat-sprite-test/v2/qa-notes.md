# 검은 고양이 v2 — 강아지 자세 편집 실험

- Built-in GPT image generation/editing used. Actual prompts: `edit-prompts/`.
- Pose edit targets: `output/dog-sprite-test/directions-v2/run/raw/<state>.png`; cat identity support: v2 front neutral. Dog poses take priority over cat body proportions.
- This is an explicit user-requested raster experiment, not a change to final rigging/style policy. No parts/rig source produced. Not integrated into active game player.
- Nine canonical rows, nineteen unique frames. Left walk/carry/sit are right-row mirrors; no independent left generation.
- Rear idle first attempt incorrectly included front/rear pair; rear walk first attempt incorrectly showed face. Both regenerated from dog rear target alone, then visually checked: no face, back ears and smooth heels.
- Front walk retains dog step A / neutral / step B, preview order 0,1,2,1. Back walk same order.
- Right walk and carry preserve approved dog poses. Front/rear frame limbs alternate visibly; right-row anatomical foot identity remains ambiguous (similar poses 1/3), inherited from dog. Locomotion remains EXPERIMENTAL and is not a clean continuity pass. No manual limb drawing or timing repair was applied.
- Carry paws now open upward and separated as dog target. Cargo remains separate; provisional cargo attachment is not production verified.
- Front and isometric right seated poses retain compact dog posture, bent knees and hands on thighs. Seat anchor/occlusion not verified in actual room.
- Canonical component extractor, compose-atlas, GIF and contact-sheet tools used. Extraction errors/warnings none; inspect errors none, five expected low-motion warnings for one-frame idle/seated states.
- Front-neutral alpha height 272 -> H90 via common scale 90/272, groundY296. Same scale across all states; no per-state H90 fitting.
- Preview compares cat and dog synchronously at user-controllable zoom. Default zoom2 for viewing only.
