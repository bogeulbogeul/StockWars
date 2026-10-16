import shutil,json
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];RUN=ROOT/'output/style-unification-v3/european-rabbit/run'
LAYOUT=[[('down_walk',0),('down_walk',1),('down_walk',2)],[('down_sit',0),('face_portrait',0),('right_idle',0)]]
HERE.mkdir(parents=True,exist_ok=True)
if not (HERE/'before').exists():
 (HERE/'before').mkdir();shutil.copytree(RUN/'frames',HERE/'before/frames')
 for n in ['sprite-sheet-alpha.png','manifest.json']:shutil.copy2(RUN/n,HERE/'before'/n)
for filename,layout,size in [('face-target.png',LAYOUT,(960,800)),('carry-target.png',[[('right_carry',i) for i in range(4)]],(1280,400))]:
 im=Image.new('RGBA',size,(0,255,255,255))
 for y,row in enumerate(layout):
  for x,(s,i) in enumerate(row):im.alpha_composite(Image.open(RUN/f'frames/{s}/frame-{i}.png'),(x*320,y*400))
 im.convert('RGB').save(HERE/filename)
shutil.copy2(RUN/'frames/right_idle/frame-0.png',HERE/'face-reference.png')
