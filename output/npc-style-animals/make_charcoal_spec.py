import json
from pathlib import Path
from PIL import Image
from collections import Counter
root=Path(__file__).parent/'motions-v2/cat/run'
# Palette authoring only: the existing sprite-gen recolor engine performs the bake.
counts=Counter(p[:3] for p in Image.open(root/'sprite-sheet-alpha.png').convert('RGBA').get_flattened_data() if p[3]>8)
colors=list(counts)
palette=[(21,21,27),(42,39,49),(57,57,65),(64,60,72),(73,68,81),(86,80,97)]
mapping={}
for c in sorted(colors):
 if max(c)-min(c)<=32 and 18<=sum(c)/3<=106:
  tone=round(sum(c)/3)
  target=(max(0,tone-2),max(0,tone-2),min(255,tone+6))
  mapping['#%02x%02x%02x'%c]='#%02x%02x%02x'%target
spec={'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,'variants':[{'name':'charcoal-unified','map':mapping}]}
(root/'charcoal-unified-spec.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
print('palette entries',len(mapping))

