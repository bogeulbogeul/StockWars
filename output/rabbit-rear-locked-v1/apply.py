import base64,hashlib,json,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
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
 raw=Image.open(HERE/'native-edit.png').convert('RGBA');parts=extract_component_images(remove_chroma_background(raw,(0,255,255),96,180,18),3)
 if not parts or len(parts)!=3:raise RuntimeError('Expected three complete separated poses')
 parts=[p.crop(p.getbbox()) for p in parts];neutral=Image.open(before/'frames/up_walk/frame-1.png').convert('RGBA');bb=neutral.getbbox();scale=(bb[3]-bb[1])/parts[1].height
 audit=[];cut=200
 for i,part in enumerate(parts):
  old=Image.open(before/f'frames/up_walk/frame-{i}.png').convert('RGBA');part=resize_cell(part,(round(part.width*scale),round(part.height*scale)))
  ox,oy=anchor(old);px,py=anchor(part);canvas=Image.new('RGBA',(320,400));canvas.alpha_composite(part,(round(ox-px),oy-py));canvas.save(HERE/f'native-registered-{i}.png')
  a=np.array(old);b=np.array(canvas);out=a.copy()
  dark_samples=a[:cut,:,:3][(a[:cut,:,3]>128)&(a[:cut,:,:3].max(-1)<75)]
  colors,counts=np.unique(dark_samples,axis=0,return_counts=True);stroke=colors[counts.argmax()]
  deep=np.array(Image.fromarray(((a[...,3]>128)*255).astype('uint8')).filter(ImageFilter.MinFilter(17)))>0
  deep&=a[...,:3].max(-1)>=140
  deep_coords=np.argwhere(deep[:cut])
  # Native contour/outline masks only; colors come exclusively from approved
  # original image samples. This project-specific protected-pixel assembly is
  # used because native recolor attempts changed the approved taupe.
  for y in range(cut):
   valid=np.where(a[y,:,3]>0)[0];dark=np.where((a[y,:,3]>128)&(a[y,:,:3].max(-1)<100))[0]
   fur=np.where(deep[y])[0]
   for x in range(320):
    alpha=int(b[y,x,3]);out[y,x,3]=alpha
    if not alpha:out[y,x,:3]=0;continue
    if b[y,x,:3].max()<115:
     out[y,x,:3]=stroke;continue
    elif deep[y,x]:
     continue
    else:pool=fur
    if not len(pool):
     near=deep_coords[np.argmin((deep_coords[:,0]-y)**2+(deep_coords[:,1]-x)**2)];out[y,x,:3]=a[near[0],near[1],:3]
    else:out[y,x,:3]=a[y,pool[np.argmin(abs(pool-x))],:3]
  assert np.array_equal(out[cut:],a[cut:])
  approved={tuple(c) for c in a[a[...,3]>0,:3]};used={tuple(c) for c in out[out[...,3]>0,:3]};assert used<=approved
  Image.fromarray(out).save(run/f'frames/up_walk/frame-{i}.png')
  audit.append({'frame':i,'body_below_y200_exact':True,'all_output_RGB_samples_from_original_approved_frame':True,'native_colors_adopted':False,'uniform_row_scale':scale,'bbox':Image.fromarray(out).getbbox()})
 shutil.copy2(run/'frames/up_walk/frame-1.png',run/'frames/up_idle/frame-0.png')
 m=json.loads((before/'manifest.json').read_text());atlas=Image.open(before/'sprite-sheet-alpha.png').convert('RGBA')
 for s in ['up_walk','up_idle']:
  for i,r in enumerate(m['frame_layout']['rows'][s]):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
 atlas.save(run/'sprite-sheet-alpha.png');atlas.save(run/'native-before-palette.png')
 unchanged=[]
 for s in m['frame_layout']['rows']:
  if s in ['up_walk','up_idle']:continue
  for p in (before/'frames'/s).glob('frame-*.png'):assert p.read_bytes()==(run/'frames'/s/p.name).read_bytes()
  unchanged.append(s)
 m['rabbit_rear_identity']={'version':'rabbit-rear-locked-v1','source':'output/rabbit-rear-locked-v1/generation.json','scope':'rear head contour only; three walk poses and shared rear idle','color_lock':'RGB samples copied exclusively from each approved original frame; native edit supplies silhouette and dark-outline masks only','body_below_y200_exact':True,'other_states_byte_identical':True,'layout_and_timing_preserved':True};write(run/'manifest.json',m)
 write(HERE/'verification.json',{'ok':True,'edited_logical_frames':4,'checks':audit,'other_states_byte_identical':unchanged,'native_RGB_not_adopted':True,'runtime_contact_QA':False})
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21);im=Image.new('RGB',(960,860),'#ede7dc');d=ImageDraw.Draw(im)
 for y,label,src in [(0,'기존 승인본',(before)),(430,'뒤 머리만 수정 · 승인본 RGB 유지',run)]:
  d.text((14,y+8),label,font=font,fill='#3b332b')
  for i in range(3):fr=Image.open(src/f'frames/up_walk/frame-{i}.png');im.paste(fr,(320*i,y+30),fr)
 im.save(HERE/'comparison.png');print('Rear head shape edited; every output color sampled from approved originals. Body and other states exact.')
if __name__=='__main__':main()
