# Front walk v1 — design review candidate

- Appearance: ../sigeureujabeujong-design-2026-10-17-v1/design-sheet.png, top-left front figure.
- Motion-only references: dog-hidden-hand-v9/dog/run/frames/down_walk/frame-{0,1,2}.png.
- Generation: built-in GPT image_gen, one horizontal state row. Two same-foot failures retained in rejected/; third row has opposite contacts and arm counter-swing.
- Extraction/composition: sprite-gen canonical component extraction, smooth RGBA, no pixel-unfake, no palette reduction. Actual files are listed in frames/frames-manifest.json.
- Alignment: complete frames translated horizontally (-18, 0, +19 px) using sprite-gen curation transforms, measured from head bounds; no body-part repainting or rigging. Native row generation replaced CLI gen-set; downstream engine stages unchanged.
- Playback: 3 unique drawings, A -> neutral -> B -> neutral, 160 ms each, total 640 ms. Neutral clone shares its atlas rectangle. manifest durations_ms is authoritative; engine integer fps display is rounded.
- Checked: correct opposite leg contacts and counter-swing on contact sheet; 4 GIF steps at 160 ms; 3 unique atlas cells; 0 empty frames, edge pixels or chroma-adjacent pixels in extractor report.
- Status: experimental design-review motion. Contact-sheet review and automatic checks complete. Real-time visual loop judgement, exact cross-frame RGB consistency and game contact testing remain unverified. Not installed into game; character assets stay removed.
