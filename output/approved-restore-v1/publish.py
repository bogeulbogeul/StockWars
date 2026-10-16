import base64,hashlib,json,shutil,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
IDS=['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit'];NAMES=['강아지','고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
items=[];checks=[]
for cid,name in zip(IDS,NAMES):
 run=ROOT/'output/style-unification-v3'/cid/'run';approved=ROOT/'output/dog-motion-match-v1'/cid/'before'
 assert (run/'sprite-sheet-alpha.png').read_bytes()==(approved/'sprite-sheet-alpha.png').read_bytes()
 for p in (approved/'frames').rglob('frame-*.png'):assert p.read_bytes()==(run/'frames'/p.relative_to(approved/'frames')).read_bytes()
 if cid!='dog':
  dst=ROOT/'output/npc-style-animals/unified-v2/cat/run' if cid=='cat' else ROOT/'output/forest-friends/sprites-v1'/cid/'run'
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(run/n,dst/n)
  shutil.copytree(run/'frames',dst/'frames',dirs_exist_ok=True);shutil.copytree(run/'qa',dst/'qa',dirs_exist_ok=True)
  shutil.copy2(run.parent/'review-final.png',dst/'qa/style-correction-contact.png')
  note={'active':'pre-motion approved original','source':str(approved.relative_to(ROOT)),'rejected':['dog-motion-match-v1','motion-color-restore-v2'],'atlas_sha256':hashlib.sha256((run/'sprite-sheet-alpha.png').read_bytes()).hexdigest()}
  for target in [run,dst]:(target/'active-version.json').write_text(json.dumps(note,ensure_ascii=False,indent=2),encoding='utf-8')
 out=HERE/cid/'run';out.mkdir(parents=True,exist_ok=True)
 for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(run/n,out/n)
 shutil.copytree(run/'frames',out/'frames',dirs_exist_ok=True);shutil.copytree(run/'qa',out/'qa',dirs_exist_ok=True)
 shutil.copy2(run.parent/'review-final.png',out.parent/'review-final.png')
 items.append({'id':cid,'label':name,'manifest':json.loads((run/'manifest.json').read_text()),'image':'data:image/png;base64,'+base64.b64encode((run/'sprite-sheet-alpha.png').read_bytes()).decode()})
 checks.append({'id':cid,'atlas_and_all_frames_byte_identical_to_approved':True})
for n,out in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(ROOT/'output/style-unification-v3/cat/run'/n,ROOT/'web/assets/characters/black-cat-npc-v2'/out)
template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8')
# Use the established two-panel renderer with identical approved source pixels.
template=template.replace('동물 8종 · 색과 그림체 보정','기존 승인본 복원').replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','기존 승인본 복원 · 8종').replace('캐릭터별 정면 기준 팔레트로 털색·명암·선을 맞췄습니다.','모션 보정 전 승인된 PNG를 그대로 복원했습니다. 추가 색 보정이나 재생성 없이 원본 바이트가 일치합니다.').replace('<small>보정 전</small>','<small>기존 승인본</small>').replace('<small>보정 후</small>','<small>복원본 · 동일 원본</small>')
for it in items:it['before']=it['image'];it['after']=it.pop('image')
labels={'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지','right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기','right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기','face_portrait':'초상화'}
(HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False)),encoding='utf-8')
(HERE/'verification.json').write_text(json.dumps({'ok':True,'checks':checks,'note':'Exact file restoration, no generation or recolor.'},ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(ROOT/'output/style-unification-v3/comparison.png',HERE/'comparison.png')
for folder in ['dog-motion-match-v1','motion-color-restore-v2']:
 p=ROOT/'output'/folder/'preview.html';s=p.read_text(encoding='utf-8');banner='<p style="padding:16px;background:#fff1cc"><b>이 수정본은 미채택입니다.</b> <a href="../approved-restore-v1/preview.html">현재 채택된 기존 승인본 보기</a></p>'
 if '이 수정본은 미채택입니다.' not in s:p.write_text(s.replace('<h1>',banner+'<h1>',1),encoding='utf-8')
with zipfile.ZipFile(HERE/'approved-original-8.zip','w',zipfile.ZIP_DEFLATED) as z:
 for cid in IDS:
  for p in (HERE/cid/'run').rglob('*'):
   if p.is_file() and (p.suffix=='.png' or p.suffix=='.gif' or p.name in ['manifest.json','sprite-request.json']):z.write(p,p.relative_to(HERE))
  z.write(HERE/cid/'review-final.png',f'{cid}/review-final.png')
 for n in ['preview.html','verification.json','comparison.png']:z.write(HERE/n,n)
print('Published exact approved originals for all eight species; cat runtime restored.')
