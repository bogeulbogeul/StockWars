from pathlib import Path
from PIL import Image, ImageChops
import json

root = Path(__file__).resolve().parent
for prefix in ('web', 'desktop'):
    results = []
    for baseline in sorted(root.glob(f'{prefix}-*-baseline.png')):
        optimized = baseline.with_name(baseline.name.replace('baseline', 'optimized'))
        with Image.open(baseline) as a, Image.open(optimized) as b:
            diff = ImageChops.difference(a.convert('RGBA'), b.convert('RGBA')).convert('RGB')
            count = sum(pixel != (0, 0, 0) for pixel in diff.get_flattened_data())
            results.append({'image': baseline.name, 'differentPixels': count, 'bbox': diff.getbbox()})
    assert len(results) == 15, (prefix, len(results))
    assert all(item['differentPixels'] == 0 for item in results), results
    (root / f'{prefix}-pixel-diff.json').write_text(json.dumps(results, indent=2))
    print(f'{prefix}: {len(results)} frame pairs, zero pixel differences')
