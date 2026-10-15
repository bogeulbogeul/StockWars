import json, shutil, subprocess, sys
from pathlib import Path

HERE=Path(__file__).parent.resolve(); ROOT=HERE.parents[2]
CLI=Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
for animal,source in zip(('dog','cat'),sys.argv[1:]):
    old=ROOT/'output/npc-style-animals/motions-v2'/animal/'run'
    run=HERE/animal/'run'; run.parent.mkdir(parents=True,exist_ok=True)
    req=json.loads((old/'sprite-request.json').read_text(encoding='utf-8-sig'))
    req['states']['face_portrait']={'frames':1,'fps':1,'loop':False,'action':'One front-facing head portrait, ears fully included, tiny neck tuft, no body. Match approved front idle face and colors.'}
    recipe=run.parent/'request.json';recipe.write_text(json.dumps(req,ensure_ascii=False,indent=2),encoding='utf-8')
    def call(verb,*args):
        p=subprocess.run([str(CLI),verb,*args],capture_output=True,text=True)
        (run/(verb+'.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
        if p.returncode:raise RuntimeError(p.stderr or p.stdout)
        print(animal,verb,'OK',flush=True)
    run.mkdir(exist_ok=True)
    call('prepare','--out-dir',str(run),'--character-id',f'{animal}-npc-portrait-v1','--base-image',str(old/'frames/down_idle/frame-0.png'),'--request',str(recipe),'--chroma-key','#00FFFF')
    shutil.copytree(old/'frames',run/'frames',dirs_exist_ok=True)
    shutil.copy2(source,run/'raw/face_portrait.png')
    call('extract','--run-dir',str(run),'--states','face_portrait')
    fm=run/'frames/frames-manifest.json'
    new=json.loads(fm.read_text(encoding='utf-8-sig')); prev=json.loads((old/'frames/frames-manifest.json').read_text(encoding='utf-8-sig'))
    rows={r['state']:r for r in prev['rows']}; rows.update({r['state']:r for r in new['rows']})
    new['rows']=[rows[s] for s in req['states']]
    new['imports']={'source':str(old),'unchanged_states':list(req['states'])[:-1]}
    fm.write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
    call('compose-atlas','--run-dir',str(run))
    call('inspect','--run-dir',str(run))
    call('preview','--run-dir',str(run))
    for s in list(req['states'])[:-1]:
        for f in (old/'frames'/s).glob('frame-*.png'):
            assert f.read_bytes()==(run/'frames'/s/f.name).read_bytes()
    (run/'qa-notes.md').write_text('2026-10-16: Added one front-facing head-only face_portrait state through native image_gen, reference=approved front idle. Canonical sprite-gen extraction and atlas composition. Original 9 states/18 frames imported with their canonical records and verified byte-identical, including corrected cat side walk. Portrait is appended as row9, cell320x400. Four atlas columns; final1280x4000 RGBA. Existing walking order0,1,2,1 at160ms remains. Separate delivery version; game sprite renderer still uses original motion atlas. No rigging or paid API.\n',encoding='utf-8')
(HERE/'README.md').write_text('# 얼굴 초상화 포함 시트\n\n강아지·고양이 각각 기존9행18그림에 얼굴 초상화1행1그림을 추가했다. 320×400셀,4열10행,1280×4000 투명PNG. 기존 모션 프레임은 모두 바이트 동일하다. 고양이는2026-10-16사선 측면 보정본이다. 게임에 연결된 모션 시트는 변경하지 않았으며 초상화 포함 전달본을 별도로 제공한다.\n',encoding='utf-8')
(HERE/'preview.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8"><title>얼굴 포함 캐릭터 시트</title><style>body{font:16px system-ui;background:#e9e7df;color:#34312c;padding:24px}main{display:flex;gap:24px;align-items:start;flex-wrap:wrap}article{background:#fffaf0;padding:16px;border-radius:12px}img{width:min(420px,85vw);height:auto}h1{font-size:24px}.face{width:160px;height:200px;object-fit:contain}</style><h1>강아지·고양이 — 얼굴 초상화 포함 시트</h1><p>기존 모션 유지 · 마지막 행에 얼굴 초상화 추가 · 1280×4000 투명PNG</p><main><article><h2>강아지</h2><img class="face" src="dog/run/frames/face_portrait/frame-0.png"><br><a href="dog/run/sprite-sheet-alpha.png"><img src="dog/run/sprite-sheet-alpha.png"></a></article><article><h2>검은 고양이</h2><img class="face" src="cat/run/frames/face_portrait/frame-0.png"><br><a href="cat/run/sprite-sheet-alpha.png"><img src="cat/run/sprite-sheet-alpha.png"></a></article></main></html>''',encoding='utf-8')
