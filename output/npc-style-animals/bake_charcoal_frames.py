import json,shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from sprite_gen.effects.recolor import bake
root=Path(__file__).parent/'motions-v2/cat/run'
mapping=json.loads((root/'charcoal-unified-spec.json').read_text(encoding='utf-8'))['variants'][0]['map']
jobs=list((root/'frames').glob('*/frame-*.png'))
def process(p):
 colors={'#%02x%02x%02x'%c[:3] for c in Image.open(p).convert('RGBA').get_flattened_data() if c[3]>8}
 selected={k:v for k,v in mapping.items() if k in colors}
 out=root/'palette-frames'/p.parent.name/p.stem
 out.mkdir(parents=True,exist_ok=True)
 spec=out/'spec.json'
 spec.write_text(json.dumps({'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,'variants':[{'name':'charcoal-unified','map':selected}]}),encoding='utf-8')
 report=bake(p,spec,out)
 result=out/'charcoal-unified.png'
 assert Image.open(p).getchannel('A').tobytes()==Image.open(result).getchannel('A').tobytes()
 return p,result,report
with ThreadPoolExecutor(max_workers=4) as pool:
 results=list(pool.map(process,jobs))
for p,result,_ in results:
 backup=root/'frames-before-palette'/p.parent.name
 backup.mkdir(parents=True,exist_ok=True)
 shutil.copy2(p,backup/p.name)
 shutil.copy2(result,p)
(root/'palette-frames/verification.json').write_text(json.dumps({'frames':len(results),'alpha_identical':True,'geometry_changed':False,'engine':'sprite-gen.effects.recolor.bake','mapping_entries':len(mapping)}),encoding='utf-8')
print('canonical palette bake complete:',len(results),'frames; alpha identical')
