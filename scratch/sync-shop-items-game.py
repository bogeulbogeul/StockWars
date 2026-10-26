import json,shutil,hashlib
from pathlib import Path
root=Path('web');dest=Path('electron-app/dist/win-unpacked/resources/web')
files=[Path('js/data/shopItemModels.js'),Path('js/data/vivianProductPlacements.js'),Path('js/components/store3d/ShopItemModels.js'),Path('js/components/store3d/VivianProductDisplay.js'),Path('js/components/store3d/ShopProductArt.js'),Path('js/components/store3d/VivianModelScene.js'),Path('js/components/store/VivianCatalogView.js')]
files.append(Path('js/components/store3d/ShopItemBatching.js'))
files+=list(p.relative_to(root) for p in (root/'assets/items/3d/refined-v2').glob('*.glb'))
records=[]
for f in files:
 target=dest/f;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/f,target)
 digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 a,b=digest(root/f),digest(target);assert a==b;records.append({'path':f.as_posix(),'sha256':a})
Path('output/shop-items-game-v1/deployment.json').write_text(json.dumps({'web':str(root.resolve()),'executableWeb':str(dest.resolve()),'files':records},indent=2),encoding='utf-8')
print('Synced',len(records),'files; SHA-256 identical')

