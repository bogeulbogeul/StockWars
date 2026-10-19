"""Install corrected cat v3 with dog-baseline timing and shared cat RGB."""
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

here=Path(__file__).parent
root=here.parents[1]
source=here/'cat/run'
dest=root/'web/assets/characters/black-cat-baseline-v3'
dest.mkdir(parents=True,exist_ok=True)
shutil.copy2(source/'sprite-sheet-alpha.png',dest/'atlas.png')
m=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
m['game_integrated']=True
m['game_input']='atlas.png'
m['shared_rgb_palette']='palette.json'
(dest/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
shutil.copy2(here/'palette.json',dest/'palette.json')
layout=m['frame_layout']
data={**layout,'cellWidth':320,'cellHeight':400}
target=root/'web/js/components/CatSpriteData.js'
target.write_text('// Corrected cat v3; generated from its manifest.\nexport const CAT_FRAMES = '+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
assert (dest/'atlas.png').read_bytes()==(source/'sprite-sheet-alpha.png').read_bytes()
bb=Image.open(source/'frames/face_portrait/frame-0.png').getbbox()
report={'atlas_sha256':hashlib.sha256((dest/'atlas.png').read_bytes()).hexdigest(),
    'source_identical':True,'destination':str(dest),'portrait_bbox':bb,
    'states':list(layout['rows']),'wag_extension_installed':False}
(here/'game-installation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
source_meta=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
source_meta['game_integrated']=True
source_meta['game_runtime']='web/assets/characters/black-cat-baseline-v3/'
(source/'manifest.json').write_text(json.dumps(source_meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
