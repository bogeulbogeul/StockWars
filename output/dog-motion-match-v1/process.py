"""Native row retakes + canonical component extraction and explicit registration.

No retiming, interpolation, bones or per-frame size normalization. The accepted
head anchor registers complete native frames; no head/body graft is adopted.
"""
import json,shutil,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
from prepare import HERE,ROOT,IDS,STATES,runpath
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def head_anchor(im):
 a=np.array(im.convert('RGBA'))[...,3]>128;ys,xs=np.where(a);top=int(ys.min());mids=[]
 for y in range(top+75,min(top+136,im.height)):
  xx=np.where(a[y])[0];runs=np.split(xx,np.where(np.diff(xx)>1)[0]+1);runs=[r for r in runs if len(r)>25]
  if runs:
   r=max(runs,key=len);mids.append((r[0]+r[-1])/2)
 return float(np.median(mids)),top
def trim_white(im):
 a=np.array(im.convert('RGBA'));keep=~(a[...,:3]>240).all(-1);ys,xs=np.where(keep)
 return im.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))

def main():
 audit=[]
 for cid in sys.argv[1:] or IDS[1:]:
  folder=HERE/cid;before=folder/'before';run=folder/'run';run.mkdir(exist_ok=True)
  shutil.copytree(before/'frames',run/'frames',dirs_exist_ok=True)
  for n in ['manifest.json','sprite-request.json']:shutil.copy2(before/n,run/n)
  ca=[]
  for state in STATES:
   n=4 if state=='right_carry' else 3;ni=0 if n==4 else 1
   raw=trim_white(Image.open(folder/(state+'-native.png')).convert('RGBA'))
   clean=remove_chroma_background(raw,(0,255,255),96,180,18)
   parts=extract_component_images(clean,n)
   if not parts or len(parts)!=n:raise RuntimeError((cid,state,'component extraction failed'))
   parts=[p.crop(p.getbbox()) for p in parts]
   neutral=Image.open(before/f'frames/{state}/frame-{ni}.png').convert('RGBA');nb=neutral.getbbox()
   scale=(nb[3]-nb[1])/parts[ni].height
   targetx,targety=head_anchor(neutral)
   dogs=[Image.open(HERE/'dog/before'/f'frames/{state}/frame-{i}.png').convert('RGBA') for i in range(n)]
   dogbase=head_anchor(dogs[ni])
   for i,part in enumerate(parts):
    if i==ni:
     out=neutral.copy();delta=(0,0);gen=None
    else:
     part=resize_cell(part,(round(part.width*scale),round(part.height*scale)))
     px,py=head_anchor(part)
     da=head_anchor(dogs[i]);delta=(0,0) if n==4 else (round(da[0]-dogbase[0]),da[1]-dogbase[1])
     left=round(targetx+delta[0]-px);top=targety+delta[1]-py
     if left<0 or top<0 or left+part.width>320 or top+part.height>400:raise RuntimeError((cid,state,i,'clipped',left,top,part.size))
     out=Image.new('RGBA',(320,400));out.alpha_composite(part,(left,top))
     gen=out.copy();candidates=run/'native-aligned'/state;candidates.mkdir(parents=True,exist_ok=True);gen.save(candidates/f'frame-{i}.png')
     # Adopt the complete native pose. Head/body graft trials created neck seams
     # and were rejected; registration is a whole-frame translation only.
    out.save(run/f'frames/{state}/frame-{i}.png')
    anchor=head_anchor(out);ca.append({'state':state,'index':i,'uniform_row_scale':scale,'head_offset_from_neutral':[round(anchor[0]-targetx,2),anchor[1]-targety],'dog_target_offset':list(delta),'head_graft':False,'neutral_original_retained':i==ni,'bbox':out.getbbox()})
   if n==3:shutil.copy2(run/f'frames/{state}/frame-1.png',run/f'frames/{state.replace("walk","idle")}/frame-0.png')
  m=json.loads((run/'manifest.json').read_text());atlas=Image.new('RGBA',(m['frame_layout']['sheetWidth'],m['frame_layout']['sheetHeight']))
  for s,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
  atlas.save(run/'sprite-sheet-alpha.png');write(run/'registration.json',ca);audit+=({'id':cid,**r} for r in ca)
  print(cid,'complete native retakes extracted and registered',flush=True)
 # Show each row in actual A/neutral/B sequence, dog as top reference.
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
 for state in STATES:
  n=4 if state=='right_carry' else 3;board=Image.new('RGB',(n*160+160,8*210),'#eee8dc');d=ImageDraw.Draw(board)
  for j,cid in enumerate(IDS):
   d.text((8,j*210+80),cid,font=font,fill='#332d24');base=HERE/cid/('before' if cid=='dog' else 'run')
   for i in range(n):
    im=Image.open(base/f'frames/{state}/frame-{i}.png').convert('RGBA').resize((160,200),Image.Resampling.LANCZOS);board.paste(im,(160+i*160,j*210),im)
  board.save(HERE/(state+'-after.png'))
 write(HERE/'registration.json',audit)
if __name__=='__main__':main()
