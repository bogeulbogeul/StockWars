import json,hashlib
from pathlib import Path
m=json.loads(Path('output/shop-items-refined-current-v2/manifest.json').read_text(encoding='utf-8-sig'))
for p in m['products']:
 f=Path('web/assets/items/3d/refined-v2')/(p['id']+'.glb');assert hashlib.sha256(f.read_bytes()).hexdigest()==p['sha256'],p['id']
print('12 refined source hashes match deployed GLBs')
for p in [Path('web/js/components/store3d')/n for n in ['ShopItemModels.js','ShopItemBatching.js','ShopProductArt.js','VivianProductDisplay.js','VivianModelScene.js']]:print(p.name,len(p.read_text(encoding='utf-8').splitlines()))
