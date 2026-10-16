import base64,hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
from process import STATES,CUTS,write
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
def main():
 run=HERE/'run';before=HERE/'before';m=json.loads((run/'manifest.json').read_text());old=json.loads((before/'manifest.json').read_text());assert m['frame_layout']==old['frame_layout'] and m['animation']==old['animation']
 changed=[];colors=set()
 for s,cut in zip(STATES,CUTS):
  for i in range(3):
   a=np.array(Image.open(before/f'frames/{s}/frame-{i}.png').convert('RGBA'))[cut:];colors.update(map(tuple,a[a[...,3]>0,:3]))
 for s,rects in m['frame_layout']['rows'].items():
  for i,r in enumerate(rects):
   p=run/f'frames/{s}/frame-{i}.png';different=p.read_bytes()!=(before/f'frames/{s}/frame-{i}.png').read_bytes()
   assert different==(s in STATES and i!=1),(s,i)
   if different:
    changed.append([s,i]);cut=CUTS[STATES.index(s)];im=Image.open(p).convert('RGBA');neutral=Image.open(before/f'frames/{s}/frame-1.png').convert('RGBA')
    assert im.crop((0,0,320,cut)).tobytes()==neutral.crop((0,0,320,cut)).tobytes()
    a=np.array(im)[cut:];assert set(map(tuple,a[a[...,3]>0,:3]))<=colors
   bb=Image.open(p).getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400
 bottoms=[]
 for i in [0,2]:
  a=np.array(Image.open(run/f'frames/down_walk/frame-{i}.png'))[...,3]>128
  bottoms.append([int(np.where(a[275:,x0:x1])[0].max()+275) for x0,x1 in [(100,140),(185,225)]])
 assert bottoms[0][0]<bottoms[0][1]-10 and bottoms[1][1]<bottoms[1][0]-10,bottoms
 for s in STATES:save_clean_gif([Image.open(run/f'frames/{s}/frame-{i}.png').convert('RGBA') for i in [0,1,2,1]],run/'qa'/(s+'.gif'),duration_ms=160,loop=0)
 report={'ok':True,'changed_frames':changed,'head_RGBA_exact_to_approved_neutral':True,'walk_head_sideways_shift_px':0,'all_body_RGB_from_approved_samples':True,'neutral_and_non_walk_frames_byte_exact':True,'front_left_right_visible_foot_bottoms_A_B':bottoms,'motion_review':'Front contacts visibly alternate; three direction pose boards reviewed. Live playback / in-game foot contact remains unverified.','physical_stride_verified':False}
 write(HERE/'verification.json',report)
 m['badger_walk_fix']={'source':'output/badger-walk-fix-v1/generation.json','front_final':'output/badger-walk-fix-v1/front-final-generation.json','rejected_single_B':'output/badger-walk-fix-v1/front-B-generation.json','color_bake':'output/badger-walk-fix-v1/color-bake/recolor.report.json','head':'approved neutral pixels held fixed','other_states_unchanged':True};write(run/'manifest.json',m)
 central=ROOT/'output/style-unification-v3/european-badger/run'
 for n in ['sprite-sheet-alpha.png','native-before-palette.png','manifest.json']:shutil.copy2(run/n,central/n)
 shutil.copytree(run/'frames',central/'frames',dirs_exist_ok=True)
 subprocess.run([sys.executable,str(ROOT/'output/style-unification-v3/finalize.py')],check=True,stdout=subprocess.DEVNULL)
 fm=json.loads((central/'frames/frames-manifest.json').read_text())
 for row in fm['rows']:
  if row['state'] in STATES:row['source']='output/badger-walk-fix-v1/generation.json'
 write(central/'frames/frames-manifest.json',fm)
 forest=ROOT/'output/forest-friends/sprites-v1/european-badger/run';game=ROOT/'web/assets/characters/forest-friends/european-badger'
 for target in [run,forest]:
  for n in ['sprite-sheet-alpha.png','manifest.json']:shutil.copy2(central/n,target/n)
  shutil.copytree(central/'frames',target/'frames',dirs_exist_ok=True);shutil.copytree(central/'qa',target/'qa',dirs_exist_ok=True)
 shutil.copy2(central.parent/'review-final.png',forest/'qa/style-correction-contact.png')
 for n,dst in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(central/n,game/dst)
 assert (game/'atlas.png').read_bytes()==(run/'sprite-sheet-alpha.png').read_bytes()
 for check in json.loads((ROOT/'output/game-sheet-install-v1/verification.json').read_text())['checks']:
  if check['id']!='european-badger':assert hashlib.sha256((ROOT/check['asset']/'atlas.png').read_bytes()).hexdigest()==check['sha256']
 write(HERE/'installation.json',{'ok':True,'game_atlas_exact':True,'other_seven_game_PNG_unchanged':True})
 labels={'down_walk':'정면 걷기','right_walk':'사선 걷기','up_walk':'뒤 걷기','right_carry':'운반 · 원본 유지','down_sit':'정면 앉기 · 원본 유지','right_sit':'사선 앉기 · 원본 유지','face_portrait':'초상화 · 원본 유지'}
 uri=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 items=[{'id':'european-badger','label':'유럽오소리 걷기 수정','manifest':m,'before':uri(before/'sprite-sheet-alpha.png'),'after':uri(run/'sprite-sheet-alpha.png')}]
 template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8').replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','오소리 걷기 수정 · 승인 얼굴·색 유지').replace('캐릭터별 정면 기준 팔레트로 털색·명암·선을 맞췄습니다.','정면 양발 교대와 머리 중심 이동을 수정했습니다. 얼굴·중립·다른 행동은 승인 원본이며 몸의 색은 승인 RGB 샘플로 고정했습니다.').replace('${it.id}/run/','run/').replace('${it.id}/review-final.png','comparison.png')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False)),encoding='utf-8')
 subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],check=True,stdout=subprocess.DEVNULL)
 for s in STATES:
  desc=run/'qa'/(s+'-sequence.json');write(desc,{'kind':'sprite-gen-asset','version':1,'frames':[{'file':f'../frames/{s}/frame-{i}.png','duration':.16} for i in [0,1,2,1]]})
  subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect-motion','--source',str(desc),'--out',str(run/'qa'/(s+'-motion.json'))],check=True,stdout=subprocess.DEVNULL)
 with zipfile.ZipFile(HERE/'badger-walk-fixed.zip','w',zipfile.ZIP_DEFLATED) as z:
  for n in ['sprite-sheet-alpha.png','manifest.json']:z.write(run/n,'run/'+n)
  for p in (run/'frames').rglob('*.png'):z.write(p,'run/'+p.relative_to(run).as_posix())
  for p in (run/'qa').glob('*.gif'):z.write(p,'run/qa/'+p.name)
  for n in ['preview.html','comparison.png','verification.json','installation.json','generation.json','front-B-generation.json','front-final-generation.json','README.md']:z.write(HERE/n,n)
 print('Verified opposite front contact poses and fixed heads. Installed only badger; other seven game PNGs unchanged.')
if __name__=='__main__':main()
