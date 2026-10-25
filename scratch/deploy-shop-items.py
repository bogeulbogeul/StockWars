import json, shutil
from pathlib import Path
root=Path('.')
m=json.loads(Path('output/shop-items-refined-current-v2/manifest.json').read_text(encoding='utf-8-sig'))
dest=Path('web/assets/items/3d/refined-v2');dest.mkdir(parents=True,exist_ok=True)
for p in m['products']: shutil.copy2(p['path'],dest/(p['id']+'.glb'))
ids=[p['id'] for p in m['products']]
Path('web/js/data/shopItemModels.js').write_text('// Current refined shop assets. Legacy item IDs preserve inventory and saves.\nexport const SHOP_ITEM_MODEL_IDS = Object.freeze('+json.dumps(ids,indent=4)+');\nexport function shopItemModelUrl(id) {\n    return SHOP_ITEM_MODEL_IDS.includes(id)\n        ? new URL(`../../assets/items/3d/refined-v2/${id}.glb`, import.meta.url).href : null;\n}\n',encoding='utf-8')
