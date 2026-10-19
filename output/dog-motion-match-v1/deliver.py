import base64,hashlib,json,shutil,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
from prepare import HERE,ROOT,IDS,STATES,runpath
from process import write

NAMES=['강아지','고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
def uri(p):return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
def main():
 checks=[];items=[];dog=HERE/'dog/before';dm=json.loads((dog/'manifest.json').read_text())
 assert (dog/'sprite-sheet-alpha.png').read_bytes()==(runpath('dog')/'sprite-sheet-alpha.png').read_bytes()
 for cid,name in zip(IDS[1:],NAMES[1:]):
  run=HERE/cid/'run';before=HERE/cid/'before';m=json.loads((run/'manifest.json').read_text());old=json.loads((before/'manifest.json').read_text())
  assert m['frame_layout']==old['frame_layout'] and m['animation']==old['animation']
  atlas=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA');changed=[]
  for s,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):
    p=run/f'frames/{s}/frame-{i}.png';im=Image.open(p).convert('RGBA');bbox=im.getbbox()
    assert im.tobytes()==atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).tobytes()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<320 and bbox[3]<400
    ni=0 if s=='right_carry' else 1
    if s not in STATES or i==ni:assert p.read_bytes()==(before/f'frames/{s}/frame-{i}.png').read_bytes(),(cid,s,i)
    else:
     assert p.read_bytes()!=(before/f'frames/{s}/frame-{i}.png').read_bytes()
     changed.append([s,i])
  assert len(changed)==9
  qa=run/'qa';qa.mkdir(exist_ok=True)
  for s in STATES:
   order=[0,1,2,1] if s.endswith('walk') else [0,1,2,3]
   save_clean_gif([Image.open(run/f'frames/{s}/frame-{i}.png').convert('RGBA') for i in order],qa/(s+'.gif'),duration_ms=160,loop=0)
   with Image.open(qa/(s+'.gif')) as gif:
    assert gif.n_frames==4
    for i in range(4):gif.seek(i);assert gif.info['duration']==160
  meta={'version':'dog-motion-match-v1','source':'output/dog-motion-match-v1/generation.json','method':'28 complete native row retakes; canonical chroma/component extraction; one isotropic scale per row and whole-frame head-anchor registration against unchanged dog','head_graft':False,'neutral_retained':True,'walk_order':[0,1,2,1],'frame_ms':160,'runtime_contact_QA':False}
  m['dog_motion_match']=meta;write(run/'manifest.json',m)
  fm=json.loads((run/'frames/frames-manifest.json').read_text())
  for row in fm['rows']:
   s=row['state']
   if s in STATES:
    row['source']='output/dog-motion-match-v1/generation.json';row['method']='components'
    for rec in row.get('frame_records',[]):
     im=Image.open(run/f"frames/{s}/frame-{rec['index']}.png").convert('RGBA');rec['bbox']=list(im.getbbox());rec['nontransparent_pixels']=int((np.array(im)[...,3]>16).sum())
  write(run/'frames/frames-manifest.json',fm)
  report={'id':cid,'changed_frames':changed,'layout_timing_unchanged':True,'neutral_idle_sit_portrait_unchanged':True,'full_native_frames_no_graft':True,'visual_QA':'four complete pose boards reviewed; static frame/loop file checks; no live browser or in-game contact test','physical_stride_verified':False}
  write(run/'motion-verification.json',report);checks.append(report)
  items.append({'id':cid,'label':name,'manifest':m,'before':uri(before/'sprite-sheet-alpha.png'),'after':uri(run/'sprite-sheet-alpha.png')})
 # Adopt into current central runs. Dog files are never overwritten.
 for cid in IDS[1:]:
  src=HERE/cid/'run';dst=runpath(cid)
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','registration.json','motion-verification.json']:shutil.copy2(src/n,dst/n)
  shutil.copy2(src/'sprite-sheet-alpha.png',dst/'native-before-palette.png')
  shutil.copytree(src/'frames',dst/'frames',dirs_exist_ok=True);shutil.copytree(src/'qa',dst/'qa',dirs_exist_ok=True)
 write(HERE/'verification.json',{'ok':True,'characters_updated':7,'native_rows':28,'changed_frames':63,'dog_atlas_sha256':hashlib.sha256((dog/'sprite-sheet-alpha.png').read_bytes()).hexdigest(),'dog_unchanged':True,'checks':checks,'runtime_contact_QA':False})
 template=(HERE/'preview-template.html').read_text(encoding='utf-8')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__DOG__',json.dumps({'manifest':dm,'image':uri(dog/'sprite-sheet-alpha.png')})),encoding='utf-8')
 print('Verified and adopted 63 complete frames in 7 species; dog PNG unchanged.')
if __name__=='__main__':main()
