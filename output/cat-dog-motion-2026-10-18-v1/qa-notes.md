# Cat motion production

Identity/colors: ../cat-design-2026-10-18-v1/design-sheet.png and colors-detailed.json.
Extra motion references: references/dog-<state>.png, cropped using latest dog manifest; pose only.
Generated rows use canonical prepare prompts and layout guides, with explicit cat/dog reference roles.
Game installation is outside this production request.

## Review and corrections

- Rejected first right_walk: near arm repeated in A/B. Regenerated with near arm back/down/forward.
- Rejected up_walk takes: stepping neutral, downward tail; then visible sole pads and wrong A/B phase. Regenerated rear neutral, smooth fur heels and correct raised-foot phase.
- Regenerated down_walk to reinforce pose order; selected physical frames 2,1,0 for dog's arm/leg A/B phase through the canonical curation sidecar.
- Sitting holds use canonical whole-frame scale 0.85 and dy35 to avoid stretching them to standing height. Source pixels are retained separately.
- Canonical curation dx offsets align the upper-head silhouette to each dog direction's neutral head center; this removes bbox-centering drift caused by the cat tail switching sides. Exact offsets are in alignment.json; no local pose drawing was used.
- Complete rows were extracted by canonical component segmentation, with no fixed-grid cutting or hand-drawn motion repair.
- Final atlas assembly shares each idle with walk neutral; walks play A/neutral/B/neutral, carry plays four frames; all durations160ms.
- RGB bake uses all42 unique sampled cat source colors, maps alpha>0, preserves alpha. This is a global nearest-RGB map, not semantic per-part masking.
- Front/side/rear pose boards inspected for limb phase, camera, visible ears, no sole pads and identity. Browser simultaneous playback and step controls inspected at127.0.0.1:8877; contact/scene review is separate.
- Tail preserves the cat's long curved silhouette. Its exact phase/contour differs from the dog's fluffy tail. Generated joint positions are reference-matched rather than pixel-identical trajectories.

Status: production candidate; static pose/alpha/palette/timing checks complete. Locomotion remains experimental until final visual approval; game installation and live gameplay contact checks are pending.
