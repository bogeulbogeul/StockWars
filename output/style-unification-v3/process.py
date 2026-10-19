"""Native edit -> canonical component extraction -> explicit shared placement.

The input is an EDIT contact board made from existing frames, not a newly
generated animation grid. Row adapters keep whole motion strips intact; sprite-gen
owns chroma cleanup/component separation. Placement uses one board-wide scale,
never normalizes each pose height. Original atlas coordinates remain authoritative.
"""
import copy,json,shutil,subprocess,sys
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
from prepare import HERE,ROOT,IDS,runpath,LAYOUT

def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def extract_board(cid,filename='native-edit.png',wag=False):
 folder=HERE/cid;before=folder/'before';dest=folder/'run'
 dest.mkdir(exist_ok=True);(dest/'frames').mkdir(exist_ok=True)
 m=json.loads((before/'manifest.json').read_text(encoding='utf-8'))
 if not wag:
  for name in ['manifest.json','sprite-request.json']:shutil.copy2(before/name,dest/name)
  shutil.copytree(before/'frames',dest/'frames',dirs_exist_ok=True)
 im=Image.open(folder/filename).convert('RGBA')
 layout=[[ (s,i) for i in range(3)] for s in json.loads((folder/'wag-layout.json').read_text())] if wag else LAYOUT
 # Native output can change resolution. ONE isotropic scale registers it to
 # the original board, preserving pose-specific dimensions and gait phases.
 scale=(960 if wag else 1280)/im.width
 audit=[]
 for y,row in enumerate(layout):
  strip=im.crop((0,round(y*im.height/len(layout)),im.width,round((y+1)*im.height/len(layout))))
  raw=dest/'style-edit-raw';raw.mkdir(exist_ok=True)
  strip.save(raw/f'{"wag" if wag else "main"}-{y}.png')
  alpha=remove_chroma_background(strip,(0,255,255),96,180,18)
  parts=extract_component_images(alpha,len(row))
  if parts is None or len(parts)!=len(row):raise RuntimeError((cid,y,'component extraction failed'))
  for (state,i),part in zip(row,parts):
   old=Image.open(before/f'frames/{state}/frame-{i}.png').convert('RGBA')
   bb=old.getbbox();bb2=part.getbbox();part=part.crop(bb2)
   size=(round(part.width*scale),round(part.height*scale))
   sprite=resize_cell(part,size)
   left=round((bb[0]+bb[2]-sprite.width)/2);top=bb[3]-sprite.height
   if left<2 or top<2 or left+sprite.width>318:raise RuntimeError((cid,state,i,'clipping',size,left,top))
   canvas=Image.new('RGBA',(320,400));canvas.alpha_composite(sprite,(left,top))
   out=dest/f'frames/{state}/frame-{i}.png';out.parent.mkdir(exist_ok=True)
   canvas.save(out)
   audit.append({'state':state,'index':i,'old_bbox':bb,'new_bbox':canvas.getbbox(),'scale':scale,'per_frame_height_normalization':False})
 if not wag:
  for d in ['down','right','up']:shutil.copy2(dest/f'frames/{d}_walk/frame-1.png',dest/f'frames/{d}_idle/frame-0.png')
 write(dest/('wag-placement.json' if wag else 'placement.json'),audit)
 return dest,m

def atlas(cid):
 run=HERE/cid/'run';m=json.loads((run/'manifest.json').read_text())
 # Existing coordinates include shared neutral cells and the dog tail packing.
 image=Image.new('RGBA',(m['frame_layout']['sheetWidth'],m['frame_layout']['sheetHeight']))
 seen={}
 for state,rects in m['frame_layout']['rows'].items():
  for i,r in enumerate(rects):
   fr=Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA')
   key=(r['x'],r['y'])
   if key in seen and seen[key]!=fr.tobytes():raise RuntimeError((cid,state,i,'shared-cell mismatch'))
   seen[key]=fr.tobytes();image.paste(fr,(r['x'],r['y']))
 image.save(run/'sprite-sheet-alpha.png')
 return image

def sync_wag_neutral(cid):
 if cid!='dog':return
 run=HERE/cid/'run'
 for s in ['down_idle','right_idle','up_idle','down_sit','right_sit','right_carry']:
  shutil.copy2(run/f'frames/{s}/frame-0.png',run/f'frames/{s}_wag/frame-1.png')

def main():
 for cid in sys.argv[1:] or IDS:
  extract_board(cid)
  if cid=='dog' and (HERE/'dog/native-wag-edit.png').exists():extract_board(cid,'native-wag-edit.png',True)
  sync_wag_neutral(cid)
  image=atlas(cid)
  # Compact pose board for visual review, alpha on neutral gray.
  board=Image.new('RGBA',(1280,1600),(230,225,213,255))
  for y,row in enumerate(LAYOUT):
   for x,(s,i) in enumerate(row):board.alpha_composite(Image.open(HERE/cid/f'run/frames/{s}/frame-{i}.png'),(x*320,y*400))
  board.convert('RGB').save(HERE/cid/'review.png')
  print(cid,'extracted and registered',flush=True)
if __name__=='__main__':main()
