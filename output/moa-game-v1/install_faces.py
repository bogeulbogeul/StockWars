"""Uniform cream Moa faces, with original facial ink and reflection masks."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'web/assets/characters/3d/somangi/faces'
target=ROOT/'web/assets/characters/3d/moa/faces'
for file in source.glob('*.png'):
    if file.stem.endswith('-specular'):
        shutil.copy2(file,target/file.name)
        continue
    image=Image.open(file).convert('RGBA')
    data=np.array(image)
    skin=data[:,:,:3].min(axis=2)>184
    data[skin,:3]=[255,219,163]
    Image.fromarray(data).save(target/file.name)
files={str(p.relative_to(target.parent)):hashlib.sha256(p.read_bytes()).hexdigest()
       for p in target.parent.rglob('*') if p.is_file() and p.name!='manifest.json'}
(target.parent/'manifest.json').write_text(json.dumps(dict(clothes=False,files=files),indent=2))
