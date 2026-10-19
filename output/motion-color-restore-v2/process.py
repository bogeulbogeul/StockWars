import json,shutil,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
from prepare import HERE,ROOT,IDS,LAYOUT,current
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def head_anchor(im):
 a=np.array(im.convert('RGBA'))[...,3]>128;ys,xs=np.where(a);top=int(ys.min());mids=[]
 for y in range(top+75,min(top+136,im.height)):
  xx=np.where(a[y])[0];runs=np.split(xx,np.where(np.diff(xx)>1)[0]+1);runs=[r for r in runs if len(r)>25]
  if runs:
   r=max(runs,key=len);mids.append((r[0]+r[-1])/2)
 return float(np.median(mids)),top
def main():
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
 for cid in sys.argv[1:] or IDS:
  folder=HERE/cid;before=folder/'before';run=folder/'run'
  if not run.exists():shutil.copytree(before,run)
  raw=Image.open(folder/'native-edit.png').convert('RGBA')
  # A single board-wide scale; no per-frame size normalization.
  scale=1280/raw.width;audit=[]
  for y,row in enumerate(LAYOUT):
   strip=raw.crop((0,round(y*raw.height/4),raw.width,round((y+1)*raw.height/4)))
   clean=remove_chroma_background(strip,(0,255,255),96,180,18)
   parts=extract_component_images(clean,4)
   if not parts or len(parts)!=4:raise RuntimeError((cid,y,'component extraction failed'))
   for (s,i),part in zip(row,parts):
    # Keep already approved neutral / static poses. Rear rabbit neutral must
    # change together with both stepping poses to carry the new round shape.
    selected=(s.endswith('_walk') and i!=1) or (s=='right_carry' and i!=0) or (cid=='european-rabbit' and s=='up_walk')
    if not selected:continue
    old=Image.open(before/f'frames/{s}/frame-{i}.png').convert('RGBA')
    part=part.crop(part.getbbox());part=resize_cell(part,(round(part.width*scale),round(part.height*scale)))
    ax,ay=head_anchor(old);px,py=head_anchor(part);left=round(ax-px);top=ay-py
    out=Image.new('RGBA',(320,400));out.alpha_composite(part,(left,top));bb=out.getbbox()
    if left<1 or top<1 or left+part.width>=320 or top+part.height>=400:raise RuntimeError((cid,s,i,'clipped',left,top,part.size))
    out.save(run/f'frames/{s}/frame-{i}.png')
    audit.append({'state':s,'index':i,'board_scale':scale,'bbox':bb,'head_anchor_before':[ax,ay],'head_anchor_after':head_anchor(out)})
  if cid=='european-rabbit':shutil.copy2(run/'frames/up_walk/frame-1.png',run/'frames/up_idle/frame-0.png')
  m=json.loads((run/'manifest.json').read_text());atlas=Image.new('RGBA',(m['frame_layout']['sheetWidth'],m['frame_layout']['sheetHeight']))
  for s,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
  atlas.save(run/'sprite-sheet-alpha.png');write(run/'color-restoration-placement.json',audit)
  review=Image.new('RGBA',(1280,1600),(237,231,220,255))
  for y,row in enumerate(LAYOUT):
   for x,(s,i) in enumerate(row):review.alpha_composite(Image.open(run/f'frames/{s}/frame-{i}.png'),(320*x,400*y))
  review.convert('RGB').save(folder/'review.png');print(cid,'color edit extracted',flush=True)
 for state in ['down_walk','right_walk','up_walk','right_carry']:
  n=4 if state=='right_carry' else 3;im=Image.new('RGB',(160*n+160,210*8),'#ede7dc');d=ImageDraw.Draw(im)
  for j,cid in enumerate(['dog']+IDS):
   d.text((8,j*210+80),cid,font=font,fill='#3b332b');run=current('dog') if cid=='dog' else HERE/cid/'run'
   for i in range(n):
    p=run/f'frames/{state}/frame-{i}.png'
    if p.exists():
     fr=Image.open(p).convert('RGBA').resize((160,200),Image.Resampling.LANCZOS);im.paste(fr,(160+i*160,j*210),fr)
  im.save(HERE/(state+'-review.png'))
if __name__=='__main__':main()
