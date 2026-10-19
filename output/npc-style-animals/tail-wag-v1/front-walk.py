import json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent
run=HERE/'dog/run'
temp=HERE/'front-walk/run'
cli=Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
req=json.loads((run/'sprite-request.json').read_text(encoding='utf-8-sig'))
req['states']={'down_walk':req['states']['down_walk']}
temp.parent.mkdir(parents=True,exist_ok=True)
recipe=temp.parent/'request.json';recipe.write_text(json.dumps(req),encoding='utf-8')
def call(*args):
 p=subprocess.run([str(cli),*args],capture_output=True,text=True,encoding='utf-8')
 if p.returncode:raise RuntimeError(p.stdout+p.stderr)
 print(args[0],'OK',flush=True)
if not temp.exists():call('prepare','--out-dir',str(temp),'--character-id','dog-front-walk-wag','--base-image',str(run/'base-source.png'),'--request',str(recipe),'--chroma-key','#00FFFF')
shutil.copy2(sys.argv[1],temp/'raw/down_walk.png')
call('extract','--run-dir',str(temp),'--states','down_walk')
dst=run/'generated-frames/down_walk';dst.mkdir(parents=True,exist_ok=True)
for i in (0,2):shutil.copy2(temp/f'frames/down_walk/frame-{i}.png',dst/f'frame-{i}.png')
code=(HERE/'lock-body.cjs').read_text()
code=code.replace("const jobs=JSON.parse(fs.readFileSync(path.join(root,'generation.json'),'utf8')), report=[];", "const jobs=[{source:'down_walk',state:'down_walk'}], report=[];")
code=code.replace("const src=await sharp(srcpath)","let src=await sharp(srcpath)").replace("const a=anchor(src), points=specs[job.source];", "let a=anchor(src), points;")
code=code.replace('for(const index of [0,2]){', '''for(const index of [0,2]){
   src=await sharp(srcpath.replace('frame-0.png',`frame-${index}.png`)).ensureAlpha().raw().toBuffer();a=anchor(src);
   points=index===0?[[163,137],[170,134],[180,118],[190,109],[200,100],[210,98],[220,96],[230,97],[240,99],[250,104],[260,123],[270,108],[280,123]]:[[163,137],[170,134],[180,121],[190,115],[200,109],[210,102],[220,95],[230,89],[240,85],[250,83],[260,85],[270,99]];
''')
code=code.replace("'body-lock-verification.json'", "'front-walk-tail-verification.json'")
code=code.replace('if(gx<0||gx>=320||gy<0||gy>=400)', 'if((index===2&&x<line(points,y)-3)||gx<0||gx>=320||gy<0||gy>=400)')
script=HERE/'lock-front-walk.cjs';script.write_text(code,encoding='utf-8')
subprocess.run(['node',str(script)],check=True)
fm=run/'frames/frames-manifest.json'; data=json.loads(fm.read_text(encoding='utf-8-sig'))
row=next(r for r in data['rows'] if r['state']=='down_walk')
for i in (0,2):
 with Image.open(run/f'frames/down_walk/frame-{i}.png') as im:
  alpha=im.getchannel('A');row['frame_records'][i]['bbox']=list(alpha.getbbox());row['frame_records'][i]['nontransparent_pixels']=sum(v>0 for v in alpha.get_flattened_data())
fm.write_text(json.dumps(data,indent=2),encoding='utf-8')
call('preview','--run-dir',str(run))
subprocess.run(['node',str(HERE/'compact.cjs')],check=True)
