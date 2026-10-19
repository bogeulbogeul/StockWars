from pathlib import Path
from PIL import Image
import json,struct
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'side-fixed-frames').glob('*.png'))]
assert len(frames)==24
frames[0].save(P/'walk-side-eye-fixed.gif',save_all=True,append_images=frames[1:],duration=[40,40,40,40,40,50]*4,loop=0)
raw=(P/'somangi-walk-eye-fixed.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n])
assert len(g['animations'])==1 and len(g['skins'])==1
for mat in g['materials']:
    assert mat['pbrMetallicRoughness']['metallicFactor']==0
    assert mat['pbrMetallicRoughness'].get('roughnessFactor',1)==1
print(json.dumps({'animations':[a.get('name') for a in g['animations']],'materials':g['materials']},indent=2))
