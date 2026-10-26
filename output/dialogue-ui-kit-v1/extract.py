"""Slice generated UI atlas without repainting or recoloring its pixels."""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r'C:/Users/bogeu/.codex/generated_images/01a1605a-f436-7670-920a-aee55e2488b2/exec-cdf4715b-af57-4480-9917-b56e78ea40f6.png')
ROWS = [
    ('moa', '모아', '#BDD6A2', (48, 154), (62, 143)),
    ('bongbong', '봉봉', '#FFB99B', (166, 265), (177, 254)),
    ('woody', '우디', '#DCBA87', (280, 380), (290, 369)),
    ('tori', '토리', '#A9BDD8', (396, 510), (416, 494)),
    ('chagok', '차곡', '#E9CD85', (530, 638), (542, 621)),
    ('doran', '도란', '#D2A4BD', (655, 771), (673, 751)),
    ('boni', '보니', '#A9D9CB', (785, 901), (804, 883)),
    ('sodam', '소담', '#C6B4DB', (918, 1025), (934, 1013)),
    ('duri', '두리', '#B6DAE9', (1048, 1161), (1065, 1145)),
    ('somang', '소망·내레이션', '#E8DDC9', (1177, 1284), (1191, 1268)),
]

ROOT.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, ROOT / 'atlas.png')
atlas = Image.open(SOURCE).convert('RGBA')
manifest = {'status': 'concept-assets-not-installed', 'source': 'atlas.png',
            'textBakedIn': False, 'portrait': False,
            'colors': {'panel': '#FFF8EB', 'textSuggested': '#4C2B1A'},
            'themes': {}, 'notes': 'Hex colors are design targets; generated paper texture varies per pixel.'}
for slug, name, color, panel_y, small_y in ROWS:
    folder = ROOT / slug
    folder.mkdir(exist_ok=True)
    boxes = {
        'dialogue-panel': (28, panel_y[0], 578, panel_y[1]),
        'nameplate': (585, small_y[0], 769, small_y[1]),
        'choice-selected': (779, small_y[0], 1078, small_y[1]),
        'next-arrow': (1090, small_y[0], 1142, small_y[1]),
    }
    files = {}
    for kind, box in boxes.items():
        sprite = atlas.crop(box)
        if kind == 'next-arrow':
            bounds = sprite.getchannel('A').getbbox()
            if bounds:
                sprite = sprite.crop(bounds)
        path = folder / f'{kind}.png'
        sprite.save(path)
        files[kind] = {'path': path.relative_to(ROOT).as_posix(), 'size': list(sprite.size), 'atlasCrop': list(box)}
        assert sprite.getchannel('A').getextrema()[0] == 0, path
        assert sprite.getchannel('A').getextrema()[1] == 255, path
    manifest['themes'][slug] = {'name': name, 'accentTarget': color, 'files': files}
common = ROOT / 'common'
common.mkdir(exist_ok=True)
shutil.copy2(ROOT / 'somang/choice-selected.png', common / 'choice-idle.png')
manifest['common'] = {'choiceIdle': 'common/choice-idle.png'}
(ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'themes': len(ROWS), 'individualPngs': 41, 'atlasSize': atlas.size, 'alphaChecks': 'passed'}, ensure_ascii=False))
