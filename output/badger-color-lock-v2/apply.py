import json,shutil
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from sprite_gen.frames.extract import remove_chroma_background,extract_component_images,resize_cell
HERE=Path(__file__).resolve().parent;STATES=['down_walk','right_walk','up_walk'];CUTS=[175,175,164]
TORSO=[(124,195,200,265),(135,188,214,260),(113,180,211,265)]
MOUTH=[(105,145,215,191),(155,140,260,184),None]
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def classes(a):
 # Outline, dark limb fur, gray torso fur and cream markings. These are
 # material masks, never output palette values.
 m=a[...,:3].max(-1);return np.where(m<48,0,np.where(m<115,1,np.where(m<194,2,3)))
def field(source,labels,kind,cut):
 valid=(source[...,3]>240)&(labels==kind);valid[:cut]=False
 ys,xs=np.where(valid)
 if not len(xs):raise RuntimeError(('missing neutral material',kind))
 # Reject edge-sample propagation: it repeats anti-aliased strokes as stripes.
 # Extend each neutral material with its interior median and gently smooth
 # that ONE shared color field. No frame-specific exposure or palette lookup.
 deep=np.array(Image.fromarray((valid*255).astype('uint8')).filter(ImageFilter.MinFilter(9)))>0
 pool=source[deep,:3] if deep.any() else source[valid,:3]
 median=np.median(pool,axis=0).astype('uint8');out=np.empty((400,320,3),dtype='uint8');out[:]=median
 if kind!=0:out[deep]=source[deep,:3]
 return np.array(Image.fromarray(out).filter(ImageFilter.GaussianBlur(3)))
def anchor(im):
 a=np.array(im)[...,3]>128;ys,xs=np.where(a);top=int(ys.min());mid=[]
 for y in range(top+75,min(top+136,im.height)):
  x=np.where(a[y])[0];runs=[r for r in np.split(x,np.where(np.diff(x)>1)[0]+1) if len(r)>25]
  if runs:r=max(runs,key=len);mid.append((r[0]+r[-1])/2)
 return float(np.median(mid)),top
def main():
 before=HERE/'before';run=HERE/'run'
 if not run.exists():shutil.copytree(before,run)
 guide=Image.open(HERE/'native-color-guide.png').convert('RGBA');reports=[]
 for j,(state,cut,box,mouth) in enumerate(zip(STATES,CUTS,TORSO,MOUTH)):
  neutral=Image.open(before/f'frames/{state}/frame-1.png').convert('RGBA');n=np.array(neutral);nc=classes(n)
  strip=guide.crop((0,round(j*guide.height/3),guide.width,round((j+1)*guide.height/3)))
  parts=extract_component_images(remove_chroma_background(strip,(0,255,255),96,180,18),3)
  if not parts or len(parts)!=3:raise RuntimeError((state,'material guide extraction'))
  parts=[p.crop(p.getbbox()) for p in parts];scale=(neutral.getbbox()[3]-neutral.getbbox()[1])/parts[1].height
  masks=[];after=[]
  for i in range(3):
   im=Image.open(before/f'frames/{state}/frame-{i}.png').convert('RGBA');a=np.array(im);c=classes(a);out=a.copy()
   if i!=1:
    part=resize_cell(parts[i],(round(parts[i].width*scale),round(parts[i].height*scale)));x,y=anchor(part);ox,oy=anchor(im);g=Image.new('RGBA',(320,400));g.alpha_composite(part,(round(ox-x),oy-y));ga=np.array(g);gc=classes(ga)
    # Guide can identify cream/gray color regions; preserve current dark limbs,
    # outline and all motion geometry. The native RGB itself is never adopted.
    body=(a[...,3]>0);body[:cut]=False
    deep=np.array(im.getchannel('A').filter(ImageFilter.MinFilter(5)))>240
    # Match each material's neutral median without moving its painted geometry.
    # Preserve outlines and edge RGB; do not propagate boundary samples.
    for k in [1,2,3]:
     mask=body&deep&(c==k);reference=(n[...,3]>240)&(nc==k);reference[:cut]=False
     if not mask.any() or not reference.any():continue
     delta=np.median(n[reference,:3],axis=0)-np.median(out[mask,:3],axis=0)
     feather=np.array(Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.GaussianBlur(2)))/255
     out[mask,:3]=np.clip(np.rint(out[mask,:3].astype(float)+feather[mask,None]*delta),0,255).astype('uint8')
    x0,y0,x1,y1=box;stable=np.zeros((400,320),bool);stable[y0:y1,x0:x1]=True
    stable&=(a[...,3]>240)&(n[...,3]>240)&(c>=2)&(nc>=2)&(ga[...,3]>240)&(gc>=2)
    sm=Image.fromarray((stable*255).astype('uint8'))
    feather=(stable.astype(float)+sum(np.array(sm.filter(ImageFilter.MinFilter(size)),dtype=float)/255 for size in [3,5,7,9]))/5
    out[stable,:3]=np.clip(np.rint(out[stable,:3]*(1-feather[stable,None])+n[stable,:3]*feather[stable,None]),0,255).astype('uint8')
    stable=np.array(sm.filter(ImageFilter.MinFilter(9)))==255
    if mouth:
     x0,y0,x1,y1=mouth;out[y0:y1,x0:x1]=n[y0:y1,x0:x1]
    else:stable[:cut]=False
    Image.fromarray(out).save(run/f'frames/{state}/frame-{i}.png')
   else:
    stable=np.zeros((400,320),bool);x0,y0,x1,y1=box;stable[y0:y1,x0:x1]=True;stable&=(n[...,3]>240)&(nc>=2)
   if mouth:
    x0,y0,x1,y1=mouth;assert np.array_equal(out[y0:y1,x0:x1],n[y0:y1,x0:x1])
   # All alpha outside the explicit mouth identity patch is exactly preserved.
   outside=np.ones((400,320),bool)
   if mouth:x0,y0,x1,y1=mouth;outside[y0:y1,x0:x1]=False
   assert np.array_equal(out[...,3][outside],a[...,3][outside])
   masks.append(stable);after.append(out)
  shared=np.logical_and.reduce(masks);assert shared.sum()>500,(state,shared.sum())
  assert all(np.array_equal(a[shared,:3],n[shared,:3]) for a in after)
  reports.append({'state':state,'shared_torso_pixels':int(shared.sum()),'max_shared_torso_RGB_delta':0,'mouth_RGBA_exact_to_neutral':bool(mouth),'motion_alpha_preserved_outside_mouth':True})
 m=json.loads((run/'manifest.json').read_text());atlas=Image.new('RGBA',(1280,4000))
 for s,rs in m['frame_layout']['rows'].items():
  for i,r in enumerate(rs):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
 atlas.save(run/'sprite-sheet-alpha.png');atlas.save(run/'native-before-palette.png')
 write(HERE/'verification.json',{'ok':True,'checks':reports,'method':'neutral material median calibration with soft boundaries; shared torso core RGB and full mouth RGBA locked to neutral; rejected edge propagation/flat-field experiments not adopted','live_playback_QA':False})
 board=Image.new('RGB',(1920,1200),'#ede7dc')
 for j,s in enumerate(STATES):
  for side,src in enumerate([before,run]):
   for i in range(3):im=Image.open(src/f'frames/{s}/frame-{i}.png');board.paste(im,(960*side+320*i,400*j),im)
 board.save(HERE/'comparison.png');print('Mouth matches neutral exactly. Shared torso pixels have zero frame-to-frame RGB delta.')
if __name__=='__main__':main()
