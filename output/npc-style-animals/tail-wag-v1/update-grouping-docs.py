import json
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
for name in ('ART_STYLE_GUIDE.md','part_separation_guide_512.md','DOG_SPRITE_BASELINE.md'):
 p=ROOT/'Docs'/name;t=p.read_text(encoding='utf-8-sig')
 t=t.replace('10행28고유그림(1280×4000)','10행28고유그림(1920×4000,6열)')
 t=t.replace('중복 중립9그림을 제거하고 대기6상태를 기존 빈 칸에 배치하여 물리적10행을 유지한다. 상태별 좌표는 manifest.frame_layout을 사용하며 한 상태가 한 행을 독점한다고 가정하지 않는다.', '같은 모션은 같은 행으로 정리한다. 정면 대기/걷기, 사선 대기/걷기, 뒤 대기/걷기, 운반, 정면 앉기, 사선 앉기, 얼굴 순서로10행이다. 운반 걷기4그림과 운반 대기용 꼬리2그림만 같은 운반 행의6칸에 모으며 다른 모션 행에 끼워 넣지 않는다. 대기 중립은 행의 가독성을 위해 표시하되 게임은 기존 중립 좌표를 공유할 수 있다. 상태별 좌표는 manifest.frame_layout을 따른다.')
 if '정면 걷기 꼬리 수정' not in t:t+='\n2026-10-16 정면 걷기 꼬리 수정: down_walk 접지A/B의 꼬리를 바깥쪽/반대쪽으로 변경했다. 중립은 기존 원본, 몸·얼굴·손발은 기존 승인 자세를 고정했다. 3그림·0→1→2→1·160ms를 유지한다. 정지 꼬리만 바뀌고 걷기는 빠졌던 이전 적용을 대체한다.\n'
 p.write_text(t,encoding='utf-8')
p=HERE/'dog/run/preservation.json';checks=json.loads(p.read_text())
for c in checks:
 if c['frame'] in ('frames/down_walk/frame-0.png','frames/down_walk/frame-2.png'):
  c['unchanged']=False;c['change']='Tail region edited; approved body/face/limbs protected. See front-walk-tail-verification.json.';c.pop('sha256',None)
p.write_text(json.dumps(checks,indent=2),encoding='utf-8')
p=HERE/'dog/run/qa-notes.md';p.write_text('2026-10-16 current delivery: ten rows, six columns,1920x4000. Each motion stays together; four carry walking frames and two extra carry-tail frames share the carry row only. Portrait last. Front walk poses0/2 now wag the tail with original body/face/limbs protected, neutral frame1 unchanged. Walking order0,1,2,1 at160ms. Original17 frames remain unchanged; two front walking frames have edited tails. Native raw and canonical extraction: front-walk/run. Packing checks all37 logical frame references,28 unique images,31 visible cells.\n',encoding='utf-8')
(HERE/'README.md').write_text('# 강아지 모션별 정리 및 정면 걷기 꼬리 수정\n\n1920×4000,6열10행. 정면 대기/걷기 → 사선 대기/걷기 → 뒤 대기/걷기 → 운반 → 정면 앉기 → 사선 앉기 → 얼굴. 운반 행만6칸(걷기4+꼬리대기2), 나머지3칸. 서로 다른 동작을 빈 칸에 끼워 넣지 않는다. 정면 걷기A/B의 꼬리도 변경했다. 기존 몸·얼굴·손발·중립과3프레임160ms는 유지한다.\n\n재생 확인: ../unified-v2/preview.html. 재조합: front-walk.py 원본이미지경로 → compact.cjs. build.py는 최초 대기 생성 재구성용으로 정면 걷기 수정은 이후 front-walk.py로 적용한다.\n',encoding='utf-8')
