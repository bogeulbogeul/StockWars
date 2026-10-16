import base64,hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
from apply import STATES,MOUTH,write
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
def main():
 run=HERE/'run';before=HERE/'before';m=json.loads((run/'manifest.json').read_text());old=json.loads((before/'manifest.json').read_text());assert m['frame_layout']==old['frame_layout'] and m['animation']==old['animation']
 changed=[]
 for s,rs in m['frame_layout']['rows'].items():
  for i,r in enumerate(rs):
   p=run/f'frames/{s}/frame-{i}.png';diff=p.read_bytes()!=(before/f'frames/{s}/frame-{i}.png').read_bytes();assert diff==(s in STATES and i!=1),(s,i)
   if diff:changed.append([s,i])
   bb=Image.open(p).getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400
 for s in STATES:
  save_clean_gif([Image.open(run/f'frames/{s}/frame-{i}.png').convert('RGBA') for i in [0,1,2,1]],run/'qa'/(s+'.gif'),duration_ms=160,loop=0)
 m['badger_color_lock_v2']={'source':'output/badger-color-lock-v2/','neutral_body_and_mouth_reference':True,'mouth_patch_extends_below_previous_head_cut':True,'verification':'output/badger-color-lock-v2/verification.json','not_just_palette_membership':True,'other_states_exact':True};write(run/'manifest.json',m)
 central=ROOT/'output/style-unification-v3/european-badger/run'
 for n in ['sprite-sheet-alpha.png','native-before-palette.png','manifest.json']:shutil.copy2(run/n,central/n)
 shutil.copytree(run/'frames',central/'frames',dirs_exist_ok=True)
 subprocess.run([sys.executable,str(ROOT/'output/style-unification-v3/finalize.py')],check=True,stdout=subprocess.DEVNULL)
 fm=json.loads((central/'frames/frames-manifest.json').read_text())
 for row in fm['rows']:
  if row['state'] in STATES:row['source']='output/badger-color-lock-v2/generation.json + neutral RGB protection; see README'
 write(central/'frames/frames-manifest.json',fm)
 forest=ROOT/'output/forest-friends/sprites-v1/european-badger/run';game=ROOT/'web/assets/characters/forest-friends/european-badger'
 for target in [run,forest]:
  for n in ['sprite-sheet-alpha.png','manifest.json']:shutil.copy2(central/n,target/n)
  shutil.copytree(central/'frames',target/'frames',dirs_exist_ok=True);shutil.copytree(central/'qa',target/'qa',dirs_exist_ok=True)
 shutil.copy2(central.parent/'review-final.png',forest/'qa/style-correction-contact.png')
 for n,dst in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(central/n,game/dst)
 for check in json.loads((ROOT/'output/game-sheet-install-v1/verification.json').read_text())['checks']:
  if check['id']!='european-badger':assert hashlib.sha256((ROOT/check['asset']/'atlas.png').read_bytes()).hexdigest()==check['sha256']
 write(HERE/'installation.json',{'ok':True,'game_atlas_exact':(game/'atlas.png').read_bytes()==(run/'sprite-sheet-alpha.png').read_bytes(),'other_seven_game_PNG_unchanged':True})
 template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8')
 template=template.replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','오소리 입·몸통 색 변화 수정').replace('캐릭터별 정면 기준 팔레트로 털색·명암·선을 맞췄습니다.','입 전체를 중립 원본으로 고정하고, 몸통 공통 영역의 프레임 간 RGB 차이가 0인지 검사했습니다. 색 목록 일치만으로 검수하지 않습니다.').replace('${it.id}/run/','run/').replace('${it.id}/review-final.png','comparison.png')
 labels={'down_walk':'정면 · 입 확인','right_walk':'사선 · 몸 색 확인','up_walk':'뒤 · 몸 색 확인','right_carry':'운반 · 원본','down_sit':'앉기 · 원본','face_portrait':'초상화 · 원본'}
 uri=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 items=[{'id':'european-badger','label':'유럽오소리','manifest':m,'before':uri(before/'sprite-sheet-alpha.png'),'after':uri(run/'sprite-sheet-alpha.png')}]
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False)),encoding='utf-8')
 shutil.copy2(ROOT/'output/style-unification-v3/validate-preview.cjs',HERE/'validate-preview.cjs');v=HERE/'validate-preview.cjs';v.write_text(v.read_text().replace('characters:8','characters:1').replace('dogTailStates:6','dogTailStates:0'))
 tested=subprocess.run(['node',str(v)],capture_output=True,text=True)
 if tested.returncode:raise RuntimeError(tested.stderr[-800:])
 subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],check=True,stdout=subprocess.DEVNULL)
 with zipfile.ZipFile(HERE/'badger-mouth-color-fixed.zip','w',zipfile.ZIP_DEFLATED) as z:
  for n in ['sprite-sheet-alpha.png','manifest.json']:z.write(run/n,'run/'+n)
  for p in (run/'frames').rglob('*.png'):z.write(p,'run/'+p.relative_to(run).as_posix())
  for p in (run/'qa').glob('*.gif'):z.write(p,'run/qa/'+p.name)
  for n in ['preview.html','comparison.png','verification.json','installation.json','generation.json','README.md','preview-verification.json']:z.write(HERE/n,n)
 print('Published mouth identity and torso RGB lock. Other seven runtime PNGs unchanged.')
if __name__=='__main__':main()
