import shutil
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];RUN=ROOT/'output/style-unification-v3/european-badger/run';STATES=['down_walk','right_walk','up_walk']
if not (HERE/'before').exists():shutil.copytree(RUN,HERE/'before')
for name,neutral in [('edit-target',False),('neutral-color-reference',True)]:
 im=Image.new('RGBA',(960,1200),(0,255,255,255))
 for j,s in enumerate(STATES):
  for i in range(3):im.alpha_composite(Image.open(RUN/f'frames/{s}/frame-{1 if neutral else i}.png'),(320*i,400*j))
 im.convert('RGB').save(HERE/(name+'.png'))
