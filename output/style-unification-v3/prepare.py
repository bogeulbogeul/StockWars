import json
from pathlib import Path
from PIL import Image

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
IDS=['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
NAMES=['강아지','고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
def runpath(cid):
 if cid=='dog':return ROOT/'output/npc-style-animals/tail-wag-v1/dog/run'
 if cid=='cat':return ROOT/'output/npc-style-animals/unified-v2/cat/run'
 return ROOT/'output/forest-friends/sprites-v1'/cid/'run'
LAYOUT=[[(s,i) for i in range(3)]+[extra] for s,extra in [('down_walk',('face_portrait',0)),('right_walk',('down_sit',0)),('up_walk',('right_sit',0))]]+[[('right_carry',i) for i in range(4)]]
def main():
 for cid in IDS:
  out=HERE/cid;out.mkdir(parents=True,exist_ok=True)
  run=runpath(cid)
  board=Image.new('RGBA',(1280,1600),(0,255,255,255))
  for y,row in enumerate(LAYOUT):
   for x,(state,i) in enumerate(row):board.alpha_composite(Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA'),(320*x,400*y))
  board.convert('RGB').save(out/'edit-target.png')
  Image.open(run/'frames/down_idle/frame-0.png').save(out/'identity.png')
  (out/'layout.json').write_text(json.dumps(LAYOUT),encoding='utf-8')
 print('Prepared 8 edit boards, 16 existing unique poses each.')
if __name__=='__main__':main()
