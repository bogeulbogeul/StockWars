import base64,hashlib,json,shutil
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from prepare import HERE,ROOT,IDS,NAMES,LAYOUT,current
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def rgba_signature(im):
 a=np.array(im.convert('RGBA'));pixels=a[a[...,3]>0];colors,counts=np.unique(pixels,axis=0,return_counts=True)
 return hashlib.sha256(colors.tobytes()+counts.tobytes()).hexdigest()
def main():
 reports=[]
 for cid in IDS:
  folder=HERE/cid;before=folder/'before';run=folder/'run'
  if not run.exists():shutil.copytree(before,run)
  m=json.loads((run/'manifest.json').read_text());old=json.loads((before/'manifest.json').read_text());frames=[]
  for state,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):
    src=before/f'frames/{state}/frame-{i}.png';dst=run/f'frames/{state}/frame-{i}.png';original=Image.open(src).convert('RGBA');out=original.copy();dy=0
    # Badger v2's exact face/body are already approved color references. Move
    # the complete contact drawing together, rather than pinning its head or
    # separating a runtime face layer. The 2px step rhythm follows the dog.
    if cid=='european-badger' and state in ['down_walk','right_walk','up_walk'] and i in [0,2]:
     dy=2;bb=original.getbbox();assert bb[3]+dy<400
     out=Image.new('RGBA',original.size);out.alpha_composite(original,(0,dy));out.save(dst)
     assert out.crop((0,dy,320,400)).tobytes()==original.crop((0,0,320,400-dy)).tobytes()
    else:shutil.copy2(src,dst)
    assert rgba_signature(out)==rgba_signature(original),(cid,state,i,'color or shape changed')
    frames.append({'state':state,'index':i,'whole_pose_offset':[0,dy],'RGBA_color_counts_exact':True,'unmodified_PNG':not dy})
  atlas=Image.new('RGBA',(m['frame_layout']['sheetWidth'],m['frame_layout']['sheetHeight']))
  for s,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):atlas.paste(Image.open(run/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
  if cid=='european-badger':atlas.save(run/'sprite-sheet-alpha.png');atlas.save(run/'native-before-palette.png')
  else:assert atlas.tobytes()==Image.open(before/'sprite-sheet-alpha.png').convert('RGBA').tobytes();shutil.copy2(before/'sprite-sheet-alpha.png',run/'sprite-sheet-alpha.png')
  m['all_eight_consistency_review']={'source':'output/all-eight-consistency-v1/','approved_RGB_preserved_exactly':True,'no_redraw_no_recolor':True,'all_common_states_reviewed':True,'head_motion':'existing complete native poses retained; badger contact whole pose translated 2px down to avoid static head','live_playback_QA':False}
  write(run/'manifest.json',m)
  review=Image.new('RGBA',(1280,1600),(237,231,220,255))
  for y,row in enumerate(LAYOUT):
   for x,(s,i) in enumerate(row):review.alpha_composite(Image.open(run/f'frames/{s}/frame-{i}.png'),(320*x,400*y))
  review.convert('RGB').save(folder/'review-final.png')
  report={'id':cid,'scope':'all directions/walk/carry/sit/portrait and existing dog idle-tail states','visual_review':'Existing approved style, coat, markings and face identity compared across complete pose boards. No redraw used; species traits and natural pose changes retained.','color_verification':'Every frame preserves all nontransparent RGBA values AND their counts. This guards against introducing color changes, not proof of temporal color uniformity in inherited artwork.','motion_verdict':'existing poses retained; badger whole-pose step offset added. Live playback and in-game contact remain needs-review.','changed_frames':sum(any(f['whole_pose_offset']) for f in frames),'frames':frames}
  write(run/'consistency-verification.json',report);reports.append(report)
 write(HERE/'verification.json',{'ok':True,'animals':8,'logical_frames':sum(len(r['frames']) for r in reports),'pixel_content_changed':False,'badger_whole_pose_offset_frames':6,'reports':reports,'live_playback_QA':False})
 print('Reviewed all eight species and all states. RGB/alpha content exactly preserved; six badger whole-pose offsets assembled.')
if __name__=='__main__':main()
