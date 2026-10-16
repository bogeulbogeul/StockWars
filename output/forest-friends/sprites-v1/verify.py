"""Verify the delivered atlas rectangles, alpha, neutral sharing and playback."""
import hashlib
import json
from PIL import Image
from sprite_gen.frames.extract import connected_components
from sprite_gen.util.gif_utils import gif_report
from prepare import HERE, IDS, write

def main():
 results=[]
 for cid in IDS:
  run=HERE/cid/'run'
  m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
  fm=json.loads((run/'frames/frames-manifest.json').read_text(encoding='utf-8'))
  sheet=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
  assert sheet.size==(1280,4000),(cid,sheet.size)
  assert sheet.getchannel('A').getextrema()==(0,255)
  count=0
  digests=[]
  for row in fm['rows']:
   state=row['state']
   rects=m['frame_layout']['rows'][state]
   assert len(rects)==row['frames']
   for relative,r in zip(row['files'],rects):
    im=Image.open(run/relative).convert('RGBA')
    assert im.size==(320,400)
    box=im.getbbox()
    assert box and box[0]>0 and box[1]>0 and box[2]<320 and box[3]<400,(cid,state,box)
    atlas=sheet.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
    assert atlas.tobytes()==im.tobytes(),(cid,state,'atlas differs from frame')
    digests.append(hashlib.sha256(im.tobytes()).hexdigest())
    count+=1
   if state.endswith('_walk'):
    anim=m['animation']['rows'][state]
    assert anim['sequence']==[0,1,2,1]
    assert anim['durations_ms']==[160]*3
    gif=gif_report(run/f'qa/{state}.gif')
    assert gif['frames']==4,(cid,state,gif)
  assert count==19
  for d in ['down','right','up']:
   assert (run/f'frames/{d}_idle/frame-0.png').read_bytes()==(run/f'frames/{d}_walk/frame-1.png').read_bytes()
  portrait=Image.open(run/'frames/face_portrait/frame-0.png').convert('RGBA')
  comps=connected_components(portrait)
  assert len([c for c in comps if c['area']>12])==1,(cid,'portrait fragments')
  inspect=json.loads((run/'sprite-inspect.report.json').read_text(encoding='utf-8'))
  assert inspect['ok']
  results.append({'id':cid,'ok':True,'states':10,'atlas_slots':count,'unique_images':len(set(digests)),'alpha':'RGBA','atlas_matches_frames':True,'walk_neutral_shared':True,'walk_order':[0,1,2,1],'frame_ms':160,'portrait_single_component':True})
 write(HERE/'verification.json',{'ok':True,'characters':results,'total_atlas_slots':sum(r['atlas_slots'] for r in results),'game_integration_tested':False})
 print(json.dumps(results,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
