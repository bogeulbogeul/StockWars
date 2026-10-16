import base64,json,shutil,zipfile,subprocess,sys
from prepare import HERE,ROOT,RUN
def main():
 dst=ROOT/'output/forest-friends/sprites-v1/european-rabbit/run'
 for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json']:shutil.copy2(RUN/n,dst/n)
 for n in ['frames','qa']:shutil.copytree(RUN/n,dst/n,dirs_exist_ok=True)
 shutil.copy2(HERE/'verification.json',dst/'rabbit-unified-verification.json')
 shutil.copy2(RUN/'verification.json',dst/'style-correction-verification.json')
 for run in [RUN,dst]:
  p=subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],capture_output=True,text=True,encoding='utf-8');assert p.returncode==0,p.stdout+p.stderr
  (run/'rabbit-unified-inspect.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
 m=json.loads((RUN/'manifest.json').read_text());data=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 item={'id':'../style-unification-v3/european-rabbit','label':'유럽토끼','manifest':m,'before':data(HERE/'before/sprite-sheet-alpha.png'),'after':data(RUN/'sprite-sheet-alpha.png')}
 labels={'down_walk':'정면 걷기','down_idle':'정면 정지','down_sit':'정면 앉기','face_portrait':'얼굴 초상화','right_carry':'운반 · 다리 무늬 제거','right_walk':'사선 걷기','right_sit':'사선 앉기','up_walk':'뒤 걷기'}
 html=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8').replace('__ITEMS__',json.dumps([item],ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False))
 html=html.replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','유럽토끼 · 얼굴 스타일 통일 / 다리 흰 무늬 제거').replace('동물 8종 · 색과 그림체 보정','유럽토끼 · 얼굴·다리 보정')
 start=html.index('<p>');end=html.index('</p>',start)+4
 html=html[:start]+'<p>정면 걷기·앉기·초상화를 수정한 사선 얼굴과 통일했습니다. 운반4프레임의 다리 위 흰 무늬를 제거하고 가슴·손·발끝·꼬리 무늬는 유지했습니다. 기존3프레임·160ms 유지.</p>'+html[end:]
 html=html.replace('</style>','label:has(#tail){display:none}main{max-width:900px}</style>')
 (HERE/'preview.html').write_text(html,encoding='utf-8')
 with zipfile.ZipFile(HERE/'rabbit-sprites-v3.zip','w',zipfile.ZIP_DEFLATED) as z:
  for n in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','verification.json']:z.write(RUN/n,n)
  for p in (RUN/'frames').rglob('frame-*.png'):z.write(p,p.relative_to(RUN).as_posix())
  for p in (RUN/'qa').glob('*.gif'):z.write(p,p.relative_to(RUN).as_posix())
  for n in ['preview.html','comparison.png','generation.json','README.md']:z.write(HERE/n,n)
 with zipfile.ZipFile(HERE/'rabbit-sprites-v3.zip') as z:assert z.testzip() is None
 print('Rabbit 19-slot atlas, preview and ZIP updated; both current runs inspect passed.')
if __name__=='__main__':main()
