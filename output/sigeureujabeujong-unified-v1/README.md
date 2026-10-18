# Unified character sheet v1

Delivery: run/sprite-sheet-alpha.png and run/manifest.json. preview.html plays the actual atlas coordinates with pause and speed controls.

Row order: front idle, front walk, right profile idle, right profile walk, rear idle, rear walk, right carry, front sit, isometric-right sit, face portrait.

Latest choices: ear-corrected rear v2, carry leg-fix v2, short-leg sitting v2, current portrait. Rejected tail-root edit excluded. No images regenerated; existing walking/carry pixels preserved. Front384px cells centered by padding to512px; no resizing. Sit/portrait PNGs extracted through sprite-gen; seated whole-body scale0.9 keeps head size near walking and does not stretch seated height. Portrait centered as UI-only state. Source mappings in sources.json; extraction provenance in pose-extract/.

Three unique walk drawings play A-neutral-B-neutral using a shared neutral clone. Carry has four drawings. durations_ms160 is authoritative over rounded integer fps label. Static states hold. No added idle-tail animation or sitting transitions. Engine inspect static-motion warnings are expected. Numeric verification in verification.json does not claim live visual/game contact approval. Installed2026-10-18 under web/assets/characters/sigeureujabeujong-unified-v1 with saved styleId dog; installation report: game-installation.json. Actual browser playtest remains unverified.
