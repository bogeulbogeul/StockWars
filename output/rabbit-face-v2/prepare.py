import json,shutil
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
RUN=ROOT/'output/style-unification-v3/european-rabbit/run'
LAYOUT=[[('right_walk',i) for i in range(3)]+[('right_sit',0)],[('right_carry',i) for i in range(4)]]
def main():
 (HERE/'before').mkdir(parents=True,exist_ok=True)
 for name in ['sprite-sheet-alpha.png','manifest.json']:
  if not (HERE/'before'/name).exists():shutil.copy2(RUN/name,HERE/'before'/name)
 if not (HERE/'before/frames').exists():shutil.copytree(RUN/'frames',HERE/'before/frames')
 board=Image.new('RGBA',(1280,800),(0,255,255,255))
 for y,row in enumerate(LAYOUT):
  for x,(s,i) in enumerate(row):board.alpha_composite(Image.open(RUN/f'frames/{s}/frame-{i}.png'),(x*320,y*400))
 board.convert('RGB').save(HERE/'edit-target.png')
 shutil.copy2(RUN/'frames/down_idle/frame-0.png',HERE/'front-reference.png')
 (HERE/'layout.json').write_text(json.dumps(LAYOUT),encoding='utf-8')
if __name__=='__main__':main()
