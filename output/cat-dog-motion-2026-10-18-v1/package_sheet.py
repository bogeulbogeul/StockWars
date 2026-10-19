"""Assemble extracted complete frames; no generative drawing or motion retiming."""
from pathlib import Path
import copy
import hashlib
import json
import shutil
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
run = root/'run'
dogroot = root.parent/'dog-rgb-motion-v1'
dog = json.loads((dogroot/'manifest.json').read_text(encoding='utf-8'))
manifest = copy.deepcopy(dog)
source_manifest = json.loads((run/'manifest.json').read_text(encoding='utf-8'))
source_atlas = Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
manifest.update(characterId='cat-dog-motion-2026-10-18-v1',
    base_image='../cat-design-2026-10-18-v1/design-sheet.png',
    color_source='../cat-design-2026-10-18-v1/colors-detailed.json',
    production='GPT row generation with cat design identity and latest dog per-state pose references; canonical component extraction; exact source-RGB nearest palette bake.',
    game_installed=False)
sheet = Image.new('RGBA', (2048,5120))
outframes = root/'frames'
layout = manifest['frame_layout']['rows']
for state, rects in layout.items():
    source_state = state.replace('_idle','_walk')
    indices = [1] if state.endswith('_idle') else ([0,1,2] if state.endswith('_walk') else range(len(rects)))
    target = outframes/state
    target.mkdir(parents=True,exist_ok=True)
    for index, source_index in enumerate(indices):
        sr = source_manifest['frame_layout']['rows'][source_state][source_index]
        frame = source_atlas.crop((sr['x'],sr['y'],sr['x']+sr['w'],sr['y']+sr['h']))
        rect = rects[index]
        sheet.alpha_composite(frame,(rect['x'],rect['y']))
        frame.save(target/f'frame-{index}.png')
sheet.save(root/'sprite-sheet-unbaked.png')
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
palette = json.loads((root.parent/'cat-design-2026-10-18-v1/colors-detailed.json').read_text(encoding='utf-8'))
shutil.copy2(root.parent/'cat-design-2026-10-18-v1/colors-detailed.json',root/'palette-source.json')
spec = dict(version=1,kind='sprite-gen-recolor',match='tolerance',tolerance=255,
    variants=[dict(name='cat-rgb-motion',map={r['hex']:r['hex'] for r in palette['colors']})])
(root/'recolor.spec.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
print('Assembled 10 rows, 19 placed drawings, 16 unique poses. Ready for canonical palette bake.')
