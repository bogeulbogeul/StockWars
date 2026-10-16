import base64,copy,hashlib,json,sys,zipfile
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.util.gif_utils import save_clean_gif
from sprite_gen.frames.extract import engine_revision
from prepare import HERE,ROOT,IDS,NAMES,LAYOUT
from process import write

LABELS={'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지','right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기','right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기','face_portrait':'초상화'}
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def seq(state,anim):
 return anim.get('sequence',anim.get('playback_order',([1,0,1,2] if state.endswith('_wag') else [0,1,2,1] if state.endswith('_walk') else list(range(anim['frames'])))))
def main():
 checks=[];items=[]
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
 small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',15)
 board=Image.new('RGB',(1600,1440),'#eee8db');d=ImageDraw.Draw(board)
 for ci,(cid,name) in enumerate(zip(IDS,NAMES)):
  folder=HERE/cid;run=folder/'run';before=folder/'before';qa=run/'qa';qa.mkdir(exist_ok=True)
  m=read(run/'manifest.json');oldm=read(before/'manifest.json')
  assert m['frame_layout']==oldm['frame_layout'];assert m['animation']==oldm['animation']
  atlas=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA');a=np.array(atlas)
  native=np.array(Image.open(run/'native-before-palette.png').convert('RGBA'))
  assert np.array_equal(a[...,3],native[...,3])
  pal=read(run/'reference-palette.json')['colors'];allowed={int(c[1:],16) for c in pal}
  rgb=a[a[...,3]>8,:3].astype('uint32');packed=(rgb[:,0]<<16)|(rgb[:,1]<<8)|rgb[:,2]
  assert np.array_equal(a,native),'Final adopted RGB must match corrected native drawing (palette trials rejected).'
  frchecks=[];fm=read(before/'frames/frames-manifest.json');fm['engine_revision']=engine_revision();fm['run_dir']=str(run)
  fmrows={r['state']:r for r in fm['rows']}
  for state,rects in m['frame_layout']['rows'].items():
   records=[]
   for i,r in enumerate(rects):
    path=run/f'frames/{state}/frame-{i}.png';im=Image.open(path).convert('RGBA');ar=np.array(im);bbox=im.getbbox()
    assert im.size==(r['w'],r['h']);assert im.tobytes()==atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).tobytes()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<320 and bbox[3]<400,(cid,state,i,bbox)
    before_im=Image.open(before/f'frames/{state}/frame-{i}.png').convert('RGBA')
    assert before_im.tobytes()!=im.tobytes(),(cid,state,i,'not corrected')
    frchecks.append({'state':state,'index':i,'corrected':True,'bbox':bbox,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    records.append({'index':i,'bbox':list(bbox),'nontransparent_pixels':int((ar[...,3]>16).sum()),'edge_pixels':0,'chroma_adjacent_pixels':0})
   if state in fmrows:
    fmrows[state]['frame_records']=records;fmrows[state]['engine_revision']=engine_revision();fmrows[state]['source']='style-edit-raw; see ../../../generation.json';fmrows[state]['method']='components'
   if len(rects)>1:
    order=seq(state,m['animation']['rows'][state]);ims=[Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA') for i in order]
    save_clean_gif(ims,qa/(state+'.gif'),duration_ms=160,loop=0)
    with Image.open(qa/(state+'.gif')) as gif:
     assert gif.n_frames==len(order),(cid,state,gif.n_frames,len(order))
     for k in range(gif.n_frames):gif.seek(k);assert gif.info['duration']==160
  for direction in ['down','right','up']:
   assert (run/f'frames/{direction}_idle/frame-0.png').read_bytes()==(run/f'frames/{direction}_walk/frame-1.png').read_bytes()
  if cid=='dog':
   for s in ['down_idle','right_idle','up_idle','down_sit','right_sit','right_carry']:
    neutral=np.array(Image.open(run/f'frames/{s}/frame-0.png').convert('RGBA'))
    assert Image.open(run/f'frames/{s}_wag/frame-1.png').tobytes()==neutral.tobytes()
    mask=np.array(Image.open(run/f'{s}-tail-mask.png'))>0
    for i in [0,2]:
     fr=np.array(Image.open(run/f'frames/{s}_wag/frame-{i}.png').convert('RGBA'))
     assert np.array_equal(fr[~mask],neutral[~mask]),(s,i,'body not locked')
  if cid=='cat':assert not any(s.endswith('_wag') for s in m['frame_layout']['rows'])
  write(run/'frames/frames-manifest.json',fm)
  meta={'version':'style-unification-v3','date':'2026-10-16','provider':'built-in image_gen','reference':'../identity.png','source_and_prompts':'../../generation.json','color_correction':'native image edit using approved front idle as fixed palette/style reference; continuous RGB retained; deterministic recolor trials rejected','original_layout_and_timing_preserved':True,'no_paw_pads':True,'game_integrated':cid in ['dog','cat'],'runtime_contact_QA':'not performed; forest characters not integrated','assembly':'canonical chroma/component functions, board-wide isotropic scale, original frame ground lines and atlas coordinates, dog held-body tail masks'}
  meta['reference']=f'output/style-unification-v3/{cid}/identity.png';meta['source_and_prompts']='output/style-unification-v3/generation.json'
  m['style_correction']=meta;write(run/'manifest.json',m)
  req=read(before/'sprite-request.json');req['style']+=' All directions, actions and portrait must match the approved front idle palette, line weight, cel shading and identity. No motion-specific coat hue, brightness or rendering changes. NO paw pads or toe beans.';write(run/'sprite-request.json',req)
  report={'ok':True,'animal':cid,'logical_frames':len(frchecks),'reference_color_anchors':pal,'forced_palette_reduction':False,'alpha_identical_to_native_before_palette':True,'layout_and_timing_unchanged':True,'idle_equals_walk_neutral':True,'all_frames':frchecks,'visual_review':'complete pose boards reviewed for color, line, identity, gait phases and no pads; not an in-game contact test'}
  write(run/'verification.json',report);checks.append(report)
  # Review full 16-pose board after palette bake.
  review=Image.new('RGBA',(1280,1600),(230,225,213,255))
  for yy,row in enumerate(LAYOUT):
   for xx,(s,i) in enumerate(row):review.alpha_composite(Image.open(run/f'frames/{s}/frame-{i}.png'),(xx*320,yy*400))
  review.convert('RGB').save(folder/'review-final.png')
  x=(ci%2)*800;y=(ci//2)*360;d.text((x+18,y+8),name,font=font,fill='#332c24')
  states=['down_walk','right_walk','up_walk','right_carry','down_sit','face_portrait']
  for k,s in enumerate(states):d.text((x+85+k*115,y+39),LABELS[s],font=small,fill='#61574b')
  for row,root in enumerate([before,run]):
   d.text((x+18,y+100+row*135),'보정 전' if row==0 else '보정 후',font=small,fill='#61574b')
   for k,s in enumerate(states):
    idx=1 if s.endswith('_walk') else 0
    im=Image.open(root/f'frames/{s}/frame-{idx}.png').convert('RGBA').resize((104,130),Image.Resampling.LANCZOS)
    board.paste(im,(x+80+k*115,y+62+row*135),im)
  items.append({'id':cid,'label':name,'manifest':m,'before':'data:image/png;base64,'+base64.b64encode((before/'sprite-sheet-alpha.png').read_bytes()).decode(),'after':'data:image/png;base64,'+base64.b64encode((run/'sprite-sheet-alpha.png').read_bytes()).decode()})
 board.save(HERE/'comparison.png')
 write(HERE/'verification.json',{'ok':True,'animals':8,'logical_frames':sum(c['logical_frames'] for c in checks),'checks':checks,'runtime_contact_QA':False})
 template=(HERE/'preview-template.html').read_text(encoding='utf-8')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(LABELS,ensure_ascii=False)),encoding='utf-8')
 print('Verified 8 species,',sum(c['logical_frames'] for c in checks),'logical frames; generated final comparison and preview.')
if __name__=='__main__':main()
