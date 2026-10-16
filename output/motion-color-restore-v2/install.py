import base64,hashlib,json,shutil,zipfile
from PIL import Image,ImageDraw,ImageFont
from prepare import HERE,ROOT,IDS,current
from process import write
doghash=json.loads((HERE/'verification.json').read_text())['dog_sha256']
for cid in IDS:
 src=current(cid);stage=HERE/cid/'run'
 # Central finalization has refreshed atlas and GIF records. Restore accurate
 # latest row provenance afterwards; the old stage remains historical only.
 fm=json.loads((src/'frames/frames-manifest.json').read_text())
 for row in fm['rows']:
  if row['state'] in ['down_walk','right_walk','up_walk','right_carry'] or (cid=='european-rabbit' and row['state']=='up_idle'):row['source']='output/motion-color-restore-v2/generation.json'
 write(src/'frames/frames-manifest.json',fm)
 dst=ROOT/'output/npc-style-animals/unified-v2/cat/run' if cid=='cat' else ROOT/'output/forest-friends/sprites-v1'/cid/'run'
 for target in [stage,dst]:
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','verification.json','color-restoration-placement.json','color-restoration-verification.json','color-restoration-qa-notes.md']:shutil.copy2(src/n,target/n)
  shutil.copytree(src/'frames',target/'frames',dirs_exist_ok=True);shutil.copytree(src/'qa',target/'qa',dirs_exist_ok=True)
 shutil.copy2(src.parent/'review-final.png',dst/'qa/style-correction-contact.png')
for n,out in [('sprite-sheet-alpha.png','atlas.png'),('manifest.json','manifest.json')]:shutil.copy2(current('cat')/n,ROOT/'web/assets/characters/black-cat-npc-v2'/out)
assert hashlib.sha256((current('dog')/'sprite-sheet-alpha.png').read_bytes()).hexdigest()==doghash
assert hashlib.sha256((ROOT/'web/assets/characters/dog-npc-v2/atlas.png').read_bytes()).hexdigest()==doghash
# Refresh the already-linked dog comparison page to display current accepted
# after images. Preserve its original pre-motion comparison and dog reference.
items=[];old=ROOT/'output/dog-motion-match-v1'
names=['고양이','붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']
def uri(p):return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
for cid,name in zip(IDS,names):items.append({'id':cid,'label':name,'manifest':json.loads((current(cid)/'manifest.json').read_text()),'before':uri(old/cid/'before/sprite-sheet-alpha.png'),'after':uri(current(cid)/'sprite-sheet-alpha.png')})
template=(old/'preview-template.html').read_text(encoding='utf-8')
template=template.replace('<header>','<p><a href="../motion-color-restore-v2/preview.html">최신 색 복원·토끼 뒷모습 비교 보기</a></p><header>').replace('토끼 뒤 걷기·대기도','토끼 뒤 걷기·대기도')
for cid in IDS:template=template.replace(f'${{it.id}}/run/', '../motion-color-restore-v2/${it.id}/run/') if cid==IDS[0] else template
(old/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__DOG__',json.dumps({'manifest':json.loads((current('dog')/'manifest.json').read_text()),'image':uri(current('dog')/'sprite-sheet-alpha.png')})),encoding='utf-8')
# Rear shape comparison, complete poses with previous frame geometry retained.
im=Image.new('RGB',(960,860),'#ede7dc');d=ImageDraw.Draw(im);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
for y,label,base in [(0,'수정 전 · 예전 각진 뒤 머리',HERE/'european-rabbit/before'),(430,'수정 후 · 둥근 토끼 뒤 머리',HERE/'european-rabbit/run')]:
 d.text((16,y+10),label,font=font,fill='#3d342c')
 for i in range(3):
  p=Image.open(base/f'frames/up_walk/frame-{i}.png').convert('RGBA');im.paste(p,(i*320,y+30),p)
im.save(HERE/'rabbit-rear-comparison.png')
write(HERE/'installation.json',{'ok':True,'updated':IDS,'runtime_updated':['black-cat-npc-v2'],'dog_png_unchanged':True,'forest_game_integrated':False})
preview=HERE/'preview.html';preview.write_text(preview.read_text(encoding='utf-8').replace("const state=document.querySelector('#state');", "const state=document.querySelector('#state');state.value='up_walk';"),encoding='utf-8')
with zipfile.ZipFile(HERE/'color-restored-7.zip','w',zipfile.ZIP_DEFLATED) as z:
 for cid in IDS:
  run=HERE/cid/'run'
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','color-restoration-placement.json','color-restoration-verification.json','color-restoration-qa-notes.md']:z.write(run/n,f'{cid}/run/{n}')
  for p in (run/'frames').rglob('*.png'):z.write(p,f'{cid}/run/'+p.relative_to(run).as_posix())
  for p in (run/'qa').glob('*.gif'):z.write(p,f'{cid}/run/qa/{p.name}')
 for n in ['README.md','generation.json','verification.json','preview.html','rabbit-rear-comparison.png']:z.write(HERE/n,n)
print('Installed restoration, refreshed original comparison, and packaged seven final sheets.')
