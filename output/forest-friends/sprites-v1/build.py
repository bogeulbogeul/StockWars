"""Canonical extraction/composition, with explicit uniform non-pixel row placement.

The stock non-pixel extractor fits each component independently. Extract roomy
cells first, then apply ONE uniform scale per whole action row, retaining pose
height differences. This project-specific alignment is recorded in each run.
"""
import copy
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image
from sprite_gen.frames.extract import resize_cell
from prepare import HERE, IDS, write

def call(run,verb,*args):
 p=subprocess.run([sys.executable,'-m','sprite_gen.cli',verb,'--run-dir',str(run),*args],capture_output=True,text=True,encoding='utf-8')
 (run/(verb+'.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
 if p.returncode: raise RuntimeError(verb+': '+p.stdout+p.stderr)

def build(cid):
 run=HERE/cid/'run'
 req=json.loads((run/'sprite-request.json').read_text(encoding='utf-8'))
 if not (run/'alignment.json').exists():
  production=copy.deepcopy(req)
  req['cell']={'shape':'rect','width':1600,'height':1600,'safe_margin_x':28,'safe_margin_y':28}
  write(run/'sprite-request.json',req)
  try: call(run,'extract')
  finally: write(run/'sprite-request.json',production)
  fm=json.loads((run/'frames/frames-manifest.json').read_text(encoding='utf-8'))
  audit=[]
  for row in fm['rows']:
   state=row['state']
   source=[]
   for relative in row['files']:
    path=run/relative
    original=Image.open(path).convert('RGBA')
    saved=run/'extracted-roomy'/state/path.name
    saved.parent.mkdir(parents=True,exist_ok=True)
    original.save(saved)
    box=original.getbbox()
    if not box: raise RuntimeError('Empty frame '+str(path))
    source.append(original.crop(box))
   maxw=max(i.width for i in source)
   maxh=max(i.height for i in source)
   targeth=224 if state=='face_portrait' else 292 if state.endswith('_sit') else 344
   factor=min(264/maxw,targeth/maxh,1)
   records=[]
   for i,(relative,im) in enumerate(zip(row['files'],source)):
    resized=resize_cell(im,(max(1,round(im.width*factor)),max(1,round(im.height*factor))))
    canvas=Image.new('RGBA',(320,400))
    canvas.alpha_composite(resized,((320-resized.width)//2,372-resized.height))
    canvas.save(run/relative)
    a=canvas.getchannel('A')
    records.append({'index':i,'nontransparent_pixels':sum(v>16 for v in a.getdata()),'bbox':list(canvas.getbbox()),'edge_pixels':0,'chroma_adjacent_pixels':0})
   row['frame_records']=records
   audit.append({'state':state,'method':'canonical roomy extraction then one uniform row scale','scale':factor,'source_max_size':[maxw,maxh],'target_max_height':targeth,'per_frame_height_normalization':False})
  rows={r['state']:r for r in fm['rows']}
  checks=[]
  for direction in ['down','right','up']:
   idle,walk=direction+'_idle',direction+'_walk'
   src=run/rows[walk]['files'][1]
   dst=run/rows[idle]['files'][0]
   shutil.copy2(src,dst)
   rows[idle]['frame_records']=[copy.deepcopy(rows[walk]['frame_records'][1])]
   rows[idle]['frame_records'][0]['index']=0
   rows[idle]['source']=walk+'/frame-1.png (byte-identical idle)'
   checks.append({'state':idle,'neutral':walk+'/frame-1.png','identical':src.read_bytes()==dst.read_bytes(),'sha256':hashlib.sha256(src.read_bytes()).hexdigest()})
  fm['cell']=production['cell']
  fm['shared_idle_neutral']=checks
  write(run/'frames/frames-manifest.json',fm)
  write(run/'alignment.json',audit)
  write(run/'transition-verification.json',checks)
 call(run,'compose-atlas')
 manifest=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
 for state,anim in manifest['animation']['rows'].items():
  if state.endswith('_walk'):
   anim.update(fps=6.25,durations_ms=[160,160,160],sequence=[0,1,2,1],playback_order=[0,1,2,1])
  elif state=='right_carry': anim.update(fps=6.25,durations_ms=[160]*4,sequence=[0,1,2,3])
 manifest['stockwars']={'kind':'forest-friends','game_integrated':False,'ground_origin':[160,372], 'world_body_height':90,'display_scale_status':'requires crown measurement and in-game contact QA', 'mirrors':{'left':'right'},'motion_review':'candidate; see qa-notes.md','uniform_row_alignment':'alignment.json'}
 write(run/'manifest.json',manifest)
 call(run,'inspect')
 call(run,'preview')
 print(cid,'built',flush=True)

if __name__=='__main__':
 for cid in sys.argv[1:] or IDS: build(cid)
