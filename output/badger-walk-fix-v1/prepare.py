import shutil
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];RUN=ROOT/'output/style-unification-v3/european-badger/run';STATES=['down_walk','right_walk','up_walk']
if not (HERE/'before').exists():shutil.copytree(RUN,HERE/'before')
for s in STATES:
 for name,run in [('target',RUN),('dog',ROOT/'output/style-unification-v3/dog/run')]:
  im=Image.new('RGBA',(960,400),(0,255,255,255))
  for i in range(3):im.alpha_composite(Image.open(run/f'frames/{s}/frame-{i}.png'),(320*i,0))
  im.convert('RGB').save(HERE/(s+'-'+name+'.png'))
 shutil.copy2(RUN/f'frames/{s}/frame-1.png',HERE/(s+'-identity.png'))
