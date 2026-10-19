import base64,hashlib,json,shutil,zipfile
from pathlib import Path
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];RUN=HERE/'run'
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 m=json.loads((RUN/'manifest.json').read_text());fm=json.loads((RUN/'frames/frames-manifest.json').read_text())
 for row in fm['rows']:
  if row['state'] in ['up_walk','up_idle']:
   row['source']='output/rabbit-rear-locked-v1/generation.json'
   for rec in row.get('frame_records',[]):rec['bbox']=list(Image.open(RUN/f"frames/{row['state']}/frame-{rec['index']}.png").getbbox())
 write(RUN/'frames/frames-manifest.json',fm)
 save_clean_gif([Image.open(RUN/f'frames/up_walk/frame-{i}.png').convert('RGBA') for i in [0,1,2,1]],RUN/'qa/up_walk.gif',duration_ms=160,loop=0)
 with Image.open(RUN/'qa/up_walk.gif') as gif:
  assert gif.n_frames==4
  for i in range(4):gif.seek(i);assert gif.info['duration']==160
 # Only the rabbit is published. No dog/cat/runtime or other animal mutations.
 dst=ROOT/'output/style-unification-v3/european-rabbit/run'
 forest=ROOT/'output/forest-friends/sprites-v1/european-rabbit/run'
 for target in [dst,forest]:
  for n in ['sprite-sheet-alpha.png','manifest.json','native-before-palette.png']:shutil.copy2(RUN/n,target/n)
  shutil.copytree(RUN/'frames',target/'frames',dirs_exist_ok=True);shutil.copy2(RUN/'qa/up_walk.gif',target/'qa/up_walk.gif')
  shutil.copy2(HERE/'verification.json',target/'rabbit-rear-verification.json')
  write(target/'active-version.json',{'active':'approved originals + rabbit rear head only','source':'output/rabbit-rear-locked-v1/','other_states':'approved original byte-identical','color_lock':'approved RGB only; native shape/outline masks'})
 other=[]
 for cid in ['dog','cat','red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear']:
  current=ROOT/'output/style-unification-v3'/cid/'run/sprite-sheet-alpha.png';approved=ROOT/'output/dog-motion-match-v1'/cid/'before/sprite-sheet-alpha.png';assert current.read_bytes()==approved.read_bytes();other.append(cid)
 write(HERE/'installation.json',{'ok':True,'only_rabbit_updated':True,'other_seven_approved_PNG_exact':other,'runtime_updated':False})
 labels={'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지','right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기','right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기','face_portrait':'초상화'}
 def uri(p):return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
 items=[{'id':'european-rabbit','label':'유럽토끼 · 뒤 머리만 수정','manifest':m,'before':uri(HERE/'before/sprite-sheet-alpha.png'),'after':uri(RUN/'sprite-sheet-alpha.png')}]
 template=(ROOT/'output/style-unification-v3/preview-template.html').read_text(encoding='utf-8')
 template=template.replace('강아지·고양이 + 숲속 친구들 6종 · 실제 스프라이트 보정','토끼 뒤 머리 통일 · 승인색 유지').replace('캐릭터별 정면 기준 팔레트로 털색·명암·선을 맞췄습니다.','뒤 걷기·대기의 머리만 둥글게 수정했습니다. 머리 RGB는 승인본에서만 가져왔으며 다른 모션과 목 아래 몸·다리는 원본 그대로입니다.').replace("state.value='down_walk'","state.value='up_walk'").replace('${it.id}/run/','run/').replace('${it.id}/review-final.png','comparison.png').replace('<a href="comparison.png">전체 보정 전후</a>','<a href="comparison.png">뒤 머리 수정 전후</a>')
 (HERE/'preview.html').write_text(template.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(labels,ensure_ascii=False)),encoding='utf-8')
 # The approved restore is a historical snapshot; point its preview at the
 # explicitly requested new rear correction without rewriting those originals.
 p=ROOT/'output/approved-restore-v1/preview.html';html=p.read_text(encoding='utf-8');banner='<p><a href="../rabbit-rear-locked-v1/preview.html">최신 토끼 뒤 머리 수정본 · 승인색 유지</a></p>'
 if '최신 토끼 뒤 머리 수정본' not in html:p.write_text(html.replace('<h1>',banner+'<h1>',1),encoding='utf-8')
 print('Published rabbit rear-only correction; other seven PNGs remain approved originals.')
if __name__=='__main__':main()
