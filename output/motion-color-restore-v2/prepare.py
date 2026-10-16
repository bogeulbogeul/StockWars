import json,shutil
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
IDS=['cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
LAYOUT=[[('down_walk',i) for i in range(3)]+[('face_portrait',0)],[('right_walk',i) for i in range(3)]+[('down_sit',0)],[('up_walk',i) for i in range(3)]+[('right_sit',0)],[('right_carry',i) for i in range(4)]]
def current(cid):return ROOT/'output/style-unification-v3'/cid/'run'
def board(run):
 im=Image.new('RGBA',(1280,1600),(0,255,255,255))
 for y,row in enumerate(LAYOUT):
  for x,(s,i) in enumerate(row):im.alpha_composite(Image.open(run/f'frames/{s}/frame-{i}.png'),(x*320,y*400))
 return im.convert('RGB')
def main():
 for cid in IDS:
  d=HERE/cid;d.mkdir(parents=True,exist_ok=True)
  if not (d/'before').exists():shutil.copytree(current(cid),d/'before')
  board(d/'before').save(d/'edit-target.png')
  board(ROOT/'output/dog-motion-match-v1'/cid/'before').save(d/'color-reference.png')
  shutil.copy2(ROOT/'output/dog-motion-match-v1'/cid/'before/frames/down_idle/frame-0.png',d/'identity.png')
 print('Prepared seven existing pose boards and approved pre-motion color references.')
if __name__=='__main__':main()
