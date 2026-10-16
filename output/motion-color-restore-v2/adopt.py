import base64,hashlib,json,shutil
import numpy as np
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
from prepare import HERE,ROOT,IDS,LAYOUT,current
from process import write
NAMES=['고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
def uri(p):return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
def main():
 checks=[];items=[];dog=current('dog')/'sprite-sheet-alpha.png';doghash=hashlib.sha256(dog.read_bytes()).hexdigest()
 for cid,name in zip(IDS,NAMES):
  d=HERE/cid;run=d/'run';before=d/'before';m=json.loads((run/'manifest.json').read_text());old=json.loads((before/'manifest.json').read_text());atlas=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
  assert m['frame_layout']==old['frame_layout'] and m['animation']==old['animation']
  changed=[]
  for s,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):
    p=run/f'frames/{s}/frame-{i}.png';im=Image.open(p).convert('RGBA');bb=im.getbbox()
    assert im.tobytes()==atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).tobytes()
    assert bb and bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400
    differs=p.read_bytes()!=(before/f'frames/{s}/frame-{i}.png').read_bytes()
    expected=(s.endswith('_walk') and i!=1) or (s=='right_carry' and i!=0) or (cid=='european-rabbit' and s in ['up_walk','up_idle'])
    assert differs==expected,(cid,s,i,differs,expected)
    if differs:changed.append([s,i])
  for direction in ['down','right','up']:assert (run/f'frames/{direction}_idle/frame-0.png').read_bytes()==(run/f'frames/{direction}_walk/frame-1.png').read_bytes()
  for s in ['down_walk','right_walk','up_walk','right_carry']:
   order=[0,1,2,1] if s.endswith('walk') else [0,1,2,3]
   save_clean_gif([Image.open(run/f'frames/{s}/frame-{i}.png').convert('RGBA') for i in order],run/'qa'/(s+'.gif'),duration_ms=160,loop=0)
   with Image.open(run/'qa'/(s+'.gif')) as gif:
    assert gif.n_frames==4
    for k in range(4):gif.seek(k);assert gif.info['duration']==160
  m['color_restoration']={'version':'motion-color-restore-v2','color_reference':f'output/dog-motion-match-v1/{cid}/before','source_and_prompts':'output/motion-color-restore-v2/generation.json','native_RGB':True,'palette_quantization':False,'rear_rabbit_shape_updated':cid=='european-rabbit','frame_layout_timing_preserved':True,'live_playback_QA':False}
  write(run/'manifest.json',m)
  fm=json.loads((run/'frames/frames-manifest.json').read_text())
  for row in fm['rows']:
   s=row['state']
   for rec in row.get('frame_records',[]):
    im=Image.open(run/f"frames/{s}/frame-{rec['index']}.png").convert('RGBA');rec['bbox']=list(im.getbbox());rec['nontransparent_pixels']=int((np.array(im)[...,3]>16).sum())
   if any(s==r[0] for r in changed):row['source']='output/motion-color-restore-v2/generation.json';row['method']='components'
  write(run/'frames/frames-manifest.json',fm)
  report={'id':cid,'changed_logical_frames':changed,'layout_timing_unchanged':True,'approved_static_frames_unchanged':True,'rabbit_rear_neutral_exception':cid=='european-rabbit','color_review':'Four state pose boards compared against approved pre-motion color references. Native RGB retained; no quantization or contrast filter.','motion_continuity':'experimental; needs live playback review','runtime_contact_QA':False}
  write(run/'color-restoration-verification.json',report);checks.append(report)
  (run/'color-restoration-qa-notes.md').write_text('Color/identity: four pose boards reviewed against approved pre-motion colors. Rabbit rear: round cheek/skull silhouette applied to all three poses and shared idle.\nWalk/carry continuity: experimental / needs-review; live browser playback and in-game contact not verified.\n',encoding='utf-8')
  dst=current(cid)
  for n in ['sprite-sheet-alpha.png','manifest.json','color-restoration-placement.json','color-restoration-verification.json','color-restoration-qa-notes.md']:shutil.copy2(run/n,dst/n)
  shutil.copytree(run/'frames',dst/'frames',dirs_exist_ok=True);shutil.copytree(run/'qa',dst/'qa',dirs_exist_ok=True)
  shutil.copy2(run/'sprite-sheet-alpha.png',dst/'native-before-palette.png')
  approved=ROOT/'output/dog-motion-match-v1'/cid/'before'
  items.append({'id':cid,'label':name,'manifest':m,'approved':uri(approved/'sprite-sheet-alpha.png'),'before':uri(before/'sprite-sheet-alpha.png'),'after':uri(run/'sprite-sheet-alpha.png')})
 assert hashlib.sha256(dog.read_bytes()).hexdigest()==doghash
 template=(ROOT/'output/dog-motion-match-v1/preview-template.html').read_text(encoding='utf-8')
 template=template.replace('강아지 기준 모션 비교','기존 색 복원 · 토끼 뒤 외형 수정').replace('강아지 기준 · 7종 모션 보정','기존 색 복원 · 토끼 뒷모습 수정').replace('강아지 → 이전 모션 → 보정 모션','기존 승인색 → 진해졌던 수정본 → 색 복원본').replace('중립·정지·앉기·초상화는 기존 유지.','토끼 뒤 걷기·대기도 둥근 머리 외형 적용.').replace("['강아지 기준','보정 전','보정 후']","['기존 승인색','진해졌던 수정본','색 복원본']").replace('[dog.image,it.before,it.after]','[it.approved,it.before,it.after]').replace('k===0?dog.manifest:it.manifest','it.manifest').replace('value="right_walk"','value="right_walk"').replace('<select id="state">','<select id="state">')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__DOG__','{}'),encoding='utf-8')
 write(HERE/'verification.json',{'ok':True,'animals':7,'changed_logical_frames':sum(len(c['changed_logical_frames']) for c in checks),'dog_png_unchanged':True,'dog_sha256':doghash,'checks':checks,'runtime_contact_QA':False})
 print('Adopted native color restoration for seven species and new round rabbit rear. Dog unchanged.')
if __name__=='__main__':main()
