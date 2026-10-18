"""Package the canonical recolor output without changing its pixels or timing."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
original = root.parent / 'sigeureujabeujong-unified-v1/run'
shutil.copy2(root / 'baked/dog-rgb-motion.png', root / 'sprite-sheet-alpha.png')
manifest = json.loads((original / 'manifest.json').read_text(encoding='utf-8'))
manifest['characterId'] = 'dog-rgb-motion-v1'
manifest['base_image'] = '../dog-design-2026-10-18-v1/design-sheet.png'
manifest['color_source'] = 'palette-source.json'
manifest['production'] = 'Existing adopted motion artwork recolored by sprite-gen; no new poses generated.'
for row in manifest['animation']['rows'].values():
    row['fps'] = 6.25
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
before = np.array(Image.open(original / 'sprite-sheet-alpha.png').convert('RGBA'))
after = np.array(Image.open(root / 'sprite-sheet-alpha.png').convert('RGBA'))
palette_data = json.loads((root / 'palette-source.json').read_text(encoding='utf-8'))
allowed = set(tuple(c['rgb']) for c in palette_data['colors'])
used = set(map(tuple, np.unique(after[after[:, :, 3] > 0, :3], axis=0)))
assert before.shape == after.shape
assert np.array_equal(before[:, :, 3], after[:, :, 3])
assert used <= allowed
layout = manifest['frame_layout']
def cut(array, rect):
    x, y, w, h = (rect[k] for k in ['x', 'y', 'w', 'h'])
    return array[y:y+h, x:x+w]
for state, rects in layout['rows'].items():
    for rect in rects:
        assert cut(after, rect)[:, :, 3].max() > 0
    assert set(manifest['animation']['rows'][state]['durations_ms']) == {160}
for direction in ['down', 'right', 'up']:
    idle = layout['rows'][direction + '_idle'][0]
    cycle = layout['rows'][direction + '_walk']
    assert np.array_equal(cut(after, idle), cut(after, cycle[1]))
    assert np.array_equal(cut(after, cycle[1]), cut(after, cycle[3]))
    assert not np.array_equal(cut(after, cycle[0]), cut(after, cycle[2]))
for state in ['down_walk', 'right_walk', 'up_walk', 'right_carry']:
    gif = Image.open(root / f'run/previews/{state}.gif')
    assert gif.n_frames == 4
    for i in range(gif.n_frames):
        gif.seek(i)
        assert gif.info['duration'] == 160
report = dict(passed=True, dimensions=[after.shape[1], after.shape[0]],
              palette_allowed=len(allowed), palette_used=len(used),
              colors_outside_palette=0, alpha_identical=True,
              states=len(layout['rows']), frame_ms=160,
              neutral_matches_idle=True, walk_A_and_B_distinct=True,
              gif_durations_verified=True, game_installed=False,
              motion_source='sigeureujabeujong-unified-v1; poses and alpha preserved',
              limitation='Nearest-RGB mapping is global, not a per-part material mask. Palette compliance does not prove each body part has an individually fixed color. No live gameplay/contact review performed.')
(root / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
# The unpack/compose engine rounds 6 fps to 167ms. Restore the source's exact
# timing in derived preview metadata; canonical delivery uses the source layout.
derived_path = root / 'run/manifest.json'
derived = json.loads(derived_path.read_text(encoding='utf-8'))
derived['characterId'] = manifest['characterId']
for row in derived['animation']['rows'].values():
    row['fps'] = 6.25
    row['durations_ms'] = [160] * row['frames']
derived_path.write_text(json.dumps(derived, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
