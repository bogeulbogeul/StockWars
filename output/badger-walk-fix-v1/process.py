import json,shutil,subprocess,sys
from pathlib import Path
from itertools import product
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
HERE=Path(__file__).resolve().parent;STATES=['down_walk','right_walk','up_walk'];CUTS=[175,175,164]
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def anchor(im):
 a=np.array(im)[...,3]>128;ys,xs=np.where(a);top=int(ys.min());m=[]
 for y in range(top+75,min(top+136,im.height)):
  x=np.where(a[y])[0];runs=[r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)>25]
  if runs:r=max(runs,key=len);m.append((r[0]+r[-1])/2)
 return float(np.median(m)),top
def main():
 before=HERE/'before';run=HERE/'run'
 if not run.exists():shutil.copytree(before,run)
 overlay=Image.new('RGBA',(960,1200));samples=[]
 for j,(s,cut) in enumerate(zip(STATES,CUTS)):
  raw=Image.open(HERE/(s+'-native.png')).convert('RGBA');parts=extract_component_images(remove_chroma_background(raw,(0,255,255),96,180,18),3)
  if not parts or len(parts)!=3:raise RuntimeError((s,'component extraction failed'))
  parts=[p.crop(p.getbbox()) for p in parts];neutral=Image.open(before/f'frames/{s}/frame-1.png').convert('RGBA');bb=neutral.getbbox();scale=(bb[3]-bb[1])/parts[1].height;nx,ny=anchor(neutral)
  for i in range(3):
   old=np.array(Image.open(before/f'frames/{s}/frame-{i}.png').convert('RGBA'));body=old[cut:];samples.append(body[body[...,3]>0,:3])
   if i==1:continue
   part=resize_cell(parts[i],(round(parts[i].width*scale),round(parts[i].height*scale)))
   px,py=anchor(part);out=Image.new('RGBA',(320,400));out.alpha_composite(part,(round(nx-px),ny-py))
   out.paste((0,0,0,0),(0,0,320,cut));overlay.paste(out,(320*i,400*j))
 overlay.save(HERE/'native-body-overlay.png')
 # A complete exact map to the approved continuous RGB samples, not a small
 # quantized palette. Nearby RGB bins only accelerate nearest-sample lookup.
 palette=np.unique(np.concatenate(samples),axis=0).astype(np.int32);bins={}
 for c in palette:bins.setdefault(tuple(c>>4),[]).append(c)
 a=np.array(overlay);colors=np.unique(a[a[...,3]>0,:3],axis=0).astype(np.int32);groups={}
 for c in colors:groups.setdefault(tuple(c>>4),[]).append(c)
 mapping={};hexrgb=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
 for key,group in groups.items():
  candidates=[bins.get(tuple(key[k]+d[k] for k in range(3)),[]) for d in product([-1,0,1],repeat=3)];candidates=[c for c in candidates if len(c)]
  pool=np.concatenate(candidates) if candidates else palette
  q=np.array(group);dist=((q[:,None,:]-pool[None,:,:])**2).sum(-1);nearest=pool[dist.argmin(1)]
  mapping.update({hexrgb(c):hexrgb(v) for c,v in zip(q,nearest)})
 write(HERE/'approved-colors.json',{'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,'variants':[{'name':'approved','map':mapping}]})
 result=subprocess.run([sys.executable,'-m','sprite_gen.cli','recolor','--base',str(HERE/'native-body-overlay.png'),'--spec',str(HERE/'approved-colors.json'),'--out-dir',str(HERE/'color-bake'),'--alpha-threshold','0'],capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stderr[-1000:])
 baked=Image.open(HERE/'color-bake/approved.png').convert('RGBA');assert baked.getchannel('A').tobytes()==overlay.getchannel('A').tobytes()
 for j,(s,cut) in enumerate(zip(STATES,CUTS)):
  neutral=Image.open(before/f'frames/{s}/frame-1.png').convert('RGBA')
  for i in [0,2]:
   out=neutral.copy();out.paste(baked.crop((320*i,400*j+cut,320*i+320,400*j+400)),(0,cut));out.save(run/f'frames/{s}/frame-{i}.png')
   assert out.crop((0,0,320,cut)).tobytes()==neutral.crop((0,0,320,cut)).tobytes()
 m=json.loads((run/'manifest.json').read_text());atlas=Image.new('RGBA',(1280,4000))
 for s,rs in m['frame_layout']['rows'].items():
  for i,r in enumerate(rs):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
 atlas.save(run/'sprite-sheet-alpha.png');atlas.save(run/'native-before-palette.png')
 board=Image.new('RGB',(1920,1200),'#ede7dc');d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
 for j,s in enumerate(STATES):
  for side,src in enumerate([before,run]):
   for i in range(3):im=Image.open(src/f'frames/{s}/frame-{i}.png');board.paste(im,(side*960+i*320,j*400),im)
 board.save(HERE/'comparison.png');print('Extracted three walk rows, fixed neutral head position and baked approved full RGB samples.')
if __name__=='__main__':main()
