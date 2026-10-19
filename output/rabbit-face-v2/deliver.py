import base64,json,shutil,zipfile,subprocess,sys
from prepare import HERE,ROOT,RUN

def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 dst=ROOT/'output/forest-friends/sprites-v1/european-rabbit/run'
 for name in ['sprite-sheet-alpha.png','manifest.json']:shutil.copy2(RUN/name,dst/name)
 shutil.copytree(RUN/'frames',dst/'frames',dirs_exist_ok=True);shutil.copytree(RUN/'qa',dst/'qa',dirs_exist_ok=True)
 shutil.copy2(RUN/'verification.json',dst/'style-correction-verification.json')
 shutil.copy2(HERE/'verification.json',dst/'rabbit-face-verification.json')
 shutil.copy2(ROOT/'output/style-unification-v3/european-rabbit/review-final.png',dst/'qa/style-correction-contact.png')
 for run in [RUN,dst]:
  req=json.loads((run/'sprite-request.json').read_text());clause=' Rabbit head: rounded cheek and jaw silhouette, short blunt muzzle, gentle rounded eyes; never feline pointed cheek tufts or sharp cat-eye shape. Retain approved original nose color.'
  if clause not in req['style']:req['style']+=clause
  write(run/'sprite-request.json',req)
 for run in [RUN,dst]:
  p=subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],capture_output=True,text=True,encoding='utf-8');(run/'rabbit-face-inspect.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8');assert p.returncode==0,p.stdout+p.stderr
 manifest=json.loads((RUN/'manifest.json').read_text())
 data=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 item={'id':'../style-unification-v3/european-rabbit','label':'유럽토끼','manifest':manifest,'before':data(HERE/'before/sprite-sheet-alpha.png'),'after':data(RUN/'sprite-sheet-alpha.png')}
 labels={'right_walk':'사선 걷기','right_idle':'사선 정지','right_carry':'운반','right_sit':'사선 앉기','down_walk':'정면 걷기 · 유지','up_walk':'뒤 걷기 · 유지','face_portrait':'초상화 · 유지'}
 html=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8').replace('__ITEMS__',json.dumps([item],ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False))
 html=html.replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','유럽토끼 · 사선 얼굴 수정').replace('동물 8종 · 색과 그림체 보정','유럽토끼 · 사선 얼굴 수정').replace("state.value='down_walk'","state.value='right_walk'")
 start=html.index('<p>');end=html.index('</p>',start)+4
 html=html[:start]+'<p>뾰족한 볼털을 둥근 볼·턱선으로 바꾸고, 짧은 토끼 주둥이와 부드러운 눈매를 적용했습니다. 기존 코 색·몸·발동작·3프레임·160ms 유지.</p>'+html[end:]
 html=html.replace('</style>','label:has(#tail){display:none}main{max-width:900px}</style>').replace('href="comparison.png">전체 보정 전후','href="comparison.png">토끼 보정 전후')
 (HERE/'preview.html').write_text(html,encoding='utf-8')
 with zipfile.ZipFile(HERE/'rabbit-sprites-v2.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','verification.json']:z.write(RUN/name,name)
  for p in (RUN/'frames').rglob('frame-*.png'):z.write(p,p.relative_to(RUN).as_posix())
  for p in (RUN/'qa').glob('*.gif'):z.write(p,p.relative_to(RUN).as_posix())
  for name in ['comparison.png','preview.html','generation.json','nose-generation.json','README.md']:z.write(HERE/name,name)
 with zipfile.ZipFile(HERE/'rabbit-sprites-v2.zip') as z:assert z.testzip() is None
 print('Rabbit frames, preview, ZIP and both current sheet paths updated; inspect passed.')
if __name__=='__main__':main()
