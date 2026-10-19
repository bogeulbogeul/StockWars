import json,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
IDS=['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
STATES=['down_walk','right_walk','up_walk','right_carry']
def runpath(cid):return ROOT/'output/style-unification-v3'/cid/'run'
def main():
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17);audit=[]
 for cid in IDS:
  folder=HERE/cid;folder.mkdir(parents=True,exist_ok=True);run=runpath(cid)
  if not (folder/'before').exists():
   (folder/'before').mkdir();shutil.copytree(run/'frames',folder/'before/frames')
   for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(run/n,folder/'before'/n)
  for state in STATES:
   n=4 if state=='right_carry' else 3;im=Image.new('RGBA',(320*n,400),(0,255,255,255))
   for i in range(n):im.alpha_composite(Image.open(run/f'frames/{state}/frame-{i}.png'),(320*i,0))
   im.convert('RGB').save(folder/(state+'-target.png'))
   idx=0 if n==4 else 1;shutil.copy2(run/f'frames/{state}/frame-{idx}.png',folder/(state+'-identity.png'))
   if n==3:
    centers=[]
    for i in range(3):
     a=np.array(Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA'))[...,3]>128
     mids=[]
     for y in range(95,166):
      xs=np.where(a[y])[0];runs=np.split(xs,np.where(np.diff(xs)>1)[0]+1)
      good=[r for r in runs if len(r)>30 and 85<r.mean()<270]
      if good:r=max(good,key=len);mids.append((r[0]+r[-1])/2)
     centers.append(round(float(np.median(mids)),2))
    audit.append({'id':cid,'state':state,'head_band_center_x':centers,'relative_to_neutral':[round(x-centers[1],2) for x in centers]})
 for state in STATES:
  n=4 if state=='right_carry' else 3;board=Image.new('RGB',(n*160+160,8*210),'#eee8dc');d=ImageDraw.Draw(board)
  for j,cid in enumerate(IDS):
   d.text((8,j*210+80),cid,font=font,fill='#332d24')
   for i in range(n):
    im=Image.open(runpath(cid)/f'frames/{state}/frame-{i}.png').convert('RGBA').resize((160,200),Image.Resampling.LANCZOS);board.paste(im,(160+i*160,j*210),im)
  board.save(HERE/(state+'-before.png'))
 (HERE/'position-audit-before.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(audit,indent=2))
if __name__=='__main__':main()
