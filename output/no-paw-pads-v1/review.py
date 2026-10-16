"""Before/after region boards for visual QA, not game art generation."""
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
def main():
 jobs=json.loads((HERE/'assembly.json').read_text(encoding='utf-8'))
 groups={}
 for j in jobs:
  if j['id']=='dog' and 'tail-wag-v1' not in j['run']:continue
  groups.setdefault((j['id'],j['state']),[]).append(j)
 board=Image.new('RGB',(850,len(groups)*190),'#ece5d8')
 d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
 for row,((cid,state),items) in enumerate(groups.items()):
  d.text((10,row*190+5),cid+' '+state,font=font,fill='#27231e')
  for col,j in enumerate(items):
   p=Path(j['run'])/'frames'/state/f"frame-{j['index']}.png"
   old=HERE/'before'/p.relative_to(ROOT)
   box=j['region'];box=[max(0,box[0]-5),max(0,box[1]-5),min(320,box[2]+5),min(400,box[3]+5)]
   for k,source in enumerate([old,p]):
    im=Image.open(source).convert('RGBA').crop(box)
    scale=min(155/im.width,137/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    x=10+col*410+k*190;y=row*190+30
    board.paste(im,(x,y),im)
    d.text((x,row*190+166),'before' if k==0 else 'after',font=font,fill='#27231e')
 board.save(HERE/'comparison.png')
if __name__=='__main__':main()
