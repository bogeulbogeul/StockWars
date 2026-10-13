# Direction pack experiment

GPT/codex subscription generation, sprite-gen prepare → gen-set anchors → extract anchors → gen-set action rows → canonical extract → compose-atlas → compose-gif → inspect. Final prompt set is generated under run/prompts and exact reference paths in run/reports/gen-set. All four directions generated independently from corresponding direction anchor; no runtime mirroring.

Approved three-pose neutral from previous test is the pre-idle source. Four direction anchors were inspected by agent: front two eyes, sides profile facing correct way, back no face/belly. Human has not separately approved these new anchors, so pack is experimental. Seated poses generated as one held pose per direction; no sit-down or stand-up transition. Both side seats have raised pelvis and bent knees rather than floor/haunch sit. Actual game chair alignment remains unverified.

First right_walk, left_walk and right_carry rows repeated the same contact silhouette. Regenerated those three rows once with explicit behind-foot / neutral / forward-foot poses. Final rows have distinct leg silhouettes. Front/back alternate raised feet; side rows read as short three-pose walking but alternating anatomical foot contact, root motion and game-speed synchronization remain unverified. All six movement rows remain experimental for motion continuity. Golden arm colors maintained, no garments or embedded props. Slight head and foot-origin shifts remain across movement frames.

Extraction returned no errors/warnings. Inspect returned no errors; seven low-motion warnings correspond to intentional one-frame idle anchors and seated holds. Requested moving display sequence is0,1,2,1 at160ms; neutral reused, no extra drawings. This sequence is owned by playback.json and the HTML, not the default three-frame atlas animation order.

Separate existing logistics parcel PNG is composited in preview only. Preview paw alignment offsets are approximate, stack0–4; hand stability/face occlusion under tall stacks and actual chair/parcel integration remain open. No production game code/assets or art policy changed.
