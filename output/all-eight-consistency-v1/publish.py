import base64,hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
from prepare import HERE,ROOT,IDS,NAMES,current
from apply import write
LABELS={'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지','right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기','right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기','face_portrait':'초상화'}
def destination(cid):
 if cid=='dog':return ROOT/'output/npc-style-animals/tail-wag-v1/dog/run'
 if cid=='cat':return ROOT/'output/npc-style-animals/unified-v2/cat/run'
 return ROOT/'output/forest-friends/sprites-v1'/cid/'run'
def runtime(cid):return ROOT/'web/assets/characters'/('dog-npc-v2' if cid=='dog' else 'black-cat-npc-v2' if cid=='cat' else 'forest-friends/'+cid)
def main():
 assert json.loads((HERE/'verification.json').read_text())['ok'];items=[];installed=[]
 for cid in IDS:
  stage=HERE/cid/'run';target=current(cid)
  # Publish only the requested badger pose-registration fix. Seven approved
  # PNG sets have passed review and remain byte-for-byte unchanged.
  if cid=='european-badger':
   for n in ['sprite-sheet-alpha.png','native-before-palette.png']:shutil.copy2(stage/n,target/n)
   shutil.copytree(stage/'frames',target/'frames',dirs_exist_ok=True)
  else:assert (stage/'sprite-sheet-alpha.png').read_bytes()==(target/'sprite-sheet-alpha.png').read_bytes()
  for n in ['manifest.json','consistency-verification.json']:shutil.copy2(stage/n,target/n)
 subprocess.run([sys.executable,str(ROOT/'output/style-unification-v3/finalize.py')],check=True,stdout=subprocess.DEVNULL)
 for cid,name in zip(IDS,NAMES):
  stage=HERE/cid/'run';src=current(cid);dst=destination(cid);game=runtime(cid)
  fm=json.loads((src/'frames/frames-manifest.json').read_text())
  if cid=='european-badger':
   for row in fm['rows']:
    if row['state'].endswith('_walk'):row['source']='output/all-eight-consistency-v1/: approved native drawing + whole-pose registration; no redraw'
   write(src/'frames/frames-manifest.json',fm)
  for target in [stage,dst]:
   for n in ['sprite-sheet-alpha.png','manifest.json','consistency-verification.json']:shutil.copy2(src/n,target/n)
   if cid=='european-badger':shutil.copytree(src/'frames',target/'frames',dirs_exist_ok=True)
   shutil.copytree(src/'qa',target/'qa',dirs_exist_ok=True)
  shutil.copy2(src.parent/'review-final.png',dst/'qa/style-correction-contact.png')
  # Keeping seven PNGs in place avoids changing an already approved asset.
  if cid=='european-badger':shutil.copy2(src/'sprite-sheet-alpha.png',game/'atlas.png')
  shutil.copy2(src/'manifest.json',game/'manifest.json')
  assert (game/'atlas.png').read_bytes()==(src/'sprite-sheet-alpha.png').read_bytes()
  if cid!='european-badger':assert (game/'atlas.png').read_bytes()==(HERE/cid/'before/sprite-sheet-alpha.png').read_bytes()
  m=json.loads((stage/'manifest.json').read_text())
  for s in ['down_walk','right_walk','up_walk','right_carry']:
   order=[0,1,2,1] if s.endswith('walk') else [0,1,2,3]
   for i in order:assert (stage/f'frames/{s}/frame-{i}.png').exists()
   with Image.open(stage/'qa'/(s+'.gif')) as gif:
    assert gif.n_frames==4
    for k in range(4):gif.seek(k);assert gif.info['duration']==160
  uri=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
  items.append({'id':cid,'label':name,'manifest':m,'before':uri(HERE/cid/'before/sprite-sheet-alpha.png'),'after':uri(stage/'sprite-sheet-alpha.png')})
  installed.append({'id':cid,'approved_RGB_content_exact':True,'runtime_PNG_exact':True,'PNG_changed':cid=='european-badger','sha256':hashlib.sha256((game/'atlas.png').read_bytes()).hexdigest()})
 write(HERE/'installation.json',{'ok':True,'animals':8,'PNG_changes':['european-badger'],'runtime':installed,'live_playback_QA':False})
 template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8')
 template=template.replace('동물 8종 · 색과 그림체 보정','8종 승인 외형·색·모션 비교').replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','8종 승인 외형·색 유지 / 걷기 비교').replace('캐릭터별 정면 기준 팔레트로 털색·명암·선을 맞췄습니다.','8종의 정지·걷기·운반·앉기·초상화를 비교했습니다. 승인된 색과 그림은 보존합니다. 오소리 걷기는 얼굴만 고정하지 않고 완성된 몸 전체가 2px 함께 움직입니다.').replace('<small>보정 전</small>','<small>이번 작업 전</small>').replace('<small>보정 후</small>','<small>현재 적용본</small>')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(LABELS,ensure_ascii=False)),encoding='utf-8')
 shutil.copy2(ROOT/'output/style-unification-v3/comparison.png',HERE/'comparison.png')
 shutil.copy2(ROOT/'output/style-unification-v3/validate-preview.cjs',HERE/'validate-preview.cjs')
 tested=subprocess.run(['node',str(HERE/'validate-preview.cjs')],capture_output=True,text=True)
 if tested.returncode:raise RuntimeError(tested.stderr[-800:])
 # State verdicts are deliberately separate from file/renderer checks.
 write(HERE/'motion-review.json',{'scope':'8 species / all common motion states and dog idle-tail states','review':'Full contact boards inspected for inherited style/color/identity. No newly rendered RGB adopted. Whole-pose registration used only for static-head badger.','verdict':'needs live playback review; file/pixel checks do not certify all temporal appearance or physical contact','actual_browser_visual_QA':False})
 with zipfile.ZipFile(HERE/'all-eight-approved-consistency.zip','w',zipfile.ZIP_DEFLATED) as z:
  for cid in IDS:
   run=HERE/cid/'run'
   for n in ['sprite-sheet-alpha.png','manifest.json','consistency-verification.json']:z.write(run/n,f'{cid}/run/{n}')
   for p in (run/'frames').rglob('*.png'):z.write(p,f'{cid}/run/'+p.relative_to(run).as_posix())
   for p in (run/'qa').glob('*.gif'):z.write(p,f'{cid}/run/qa/{p.name}')
   z.write(HERE/cid/'review-final.png',f'{cid}/review-final.png')
  for n in ['README.md','preview.html','verification.json','installation.json','motion-review.json','preview-verification.json','comparison.png']:z.write(HERE/n,n)
 print('Published 8-species approved-content review and badger coupled walk poses; source RGB/alpha preserved exactly.')
if __name__=='__main__':main()
