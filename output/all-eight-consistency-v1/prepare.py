import json,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
IDS=['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
NAMES=['강아지','고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
LAYOUT=[[('down_walk',i) for i in range(3)]+[('face_portrait',0)],[('right_walk',i) for i in range(3)]+[('down_sit',0)],[('up_walk',i) for i in range(3)]+[('right_sit',0)],[('right_carry',i) for i in range(4)]]
def current(cid):return ROOT/'output/style-unification-v3'/cid/'run'
def main():
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
 for group in range(2):
  overview=Image.new('RGB',(1280,1680),'#ede7dc');d=ImageDraw.Draw(overview)
  for k,cid in enumerate(IDS[group*4:group*4+4]):
   folder=HERE/cid;folder.mkdir(exist_ok=True)
   if not (folder/'before').exists():shutil.copytree(current(cid),folder/'before')
   board=Image.new('RGBA',(1280,1600),(237,231,220,255))
   for y,row in enumerate(LAYOUT):
    for x,(s,i) in enumerate(row):board.alpha_composite(Image.open(current(cid)/f'frames/{s}/frame-{i}.png'),(320*x,400*y))
   board.convert('RGB').save(folder/'before-review.png')
   x=(k%2)*640;y=(k//2)*840;overview.paste(board.resize((640,800)),(x,y+36));d.text((x+12,y+5),NAMES[IDS.index(cid)],font=font,fill='#332c24')
  overview.save(HERE/f'audit-{group+1}.png')
 print('Saved eight current asset snapshots and all-motion review boards.')
if __name__=='__main__':main()
