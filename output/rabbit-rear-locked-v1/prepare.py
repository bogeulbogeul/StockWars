import shutil
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];RUN=ROOT/'output/style-unification-v3/european-rabbit/run'
if not (HERE/'before').exists():shutil.copytree(RUN,HERE/'before')
im=Image.new('RGBA',(960,400),(0,255,255,255))
for i in range(3):im.alpha_composite(Image.open(RUN/f'frames/up_walk/frame-{i}.png'),(i*320,0))
im.convert('RGB').save(HERE/'rear-target.png')
im=Image.new('RGBA',(960,400),(0,255,255,255))
for i,s in enumerate(['down_idle','right_idle','right_sit']):im.alpha_composite(Image.open(RUN/f'frames/{s}/frame-0.png'),(i*320,0))
im.convert('RGB').save(HERE/'identity-reference.png')
