"""Portrait component extraction and exact requested playback exports."""
import copy
import json
from PIL import Image, ImageDraw, ImageFont
from sprite_gen.frames.extract import connected_components, component_group_image, fit_to_cell
from sprite_gen.util.gif_utils import save_clean_gif, gif_report
from prepare import HERE, IDS, write
from build import build

def main():
 for cid in IDS:
  run=HERE/cid/'run'
  req=json.loads((run/'sprite-request.json').read_text(encoding='utf-8'))
  fm=json.loads((run/'frames/frames-manifest.json').read_text(encoding='utf-8'))
  raw=Image.open(run/'raw/face_portrait.png').convert('RGBA')
  components=connected_components(raw)
  largest=max(components,key=lambda c:c['area'])
  isolated=component_group_image(raw,[largest])
  isolated.save(run/'portrait-isolated.png')
  portrait=fit_to_cell(isolated,320,400,48,88,req['fit'])
  # Keep the same review-scale portrait as the other UI states; no text/palette.
  portrait.save(run/'frames/face_portrait/frame-0.png')
  row=next(r for r in fm['rows'] if r['state']=='face_portrait')
  row['frame_records']=[{'index':0,'bbox':list(portrait.getbbox()),'nontransparent_pixels':sum(v>16 for v in portrait.getchannel('A').getdata()),'edge_pixels':0,'chroma_adjacent_pixels':0}]
  row['source']='portrait-isolated.png; canonical largest connected component, excludes sheet labels and palette'
  write(run/'frames/frames-manifest.json',fm)
  build(cid)
  playback=[]
  for state in ['down_walk','right_walk','up_walk','right_carry']:
   count=3 if state.endswith('_walk') else 4
   frames=[Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA') for i in range(count)]
   seq=[0,1,2,1] if count==3 else [0,1,2,3]
   out=run/f'qa/{state}.gif'
   save_clean_gif([frames[i] for i in seq],out,duration_ms=160,loop=0)
   playback.append({'state':state,'order':seq,'duration_ms':160,'gif':gif_report(out)})
  write(run/'playback-verification.json',playback)
  states=['down_walk','right_walk','up_walk','right_carry','down_sit','right_sit']
  contact=Image.new('RGB',(800,6*225),'#e8e3d7')
  draw=ImageDraw.Draw(contact)
  font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
  for y,state in enumerate(states):
   draw.text((10,y*225+2),state,font=font,fill='#302b24')
   n=req['states'][state]['frames']
   for i in range(n):
    im=Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA').resize((160,200),Image.Resampling.LANCZOS)
    contact.paste(im,(i*195,y*225+22),im)
  contact.save(run/'qa/motion-contact.png')
  print(cid,'portrait and playback finalized',flush=True)

if __name__=='__main__': main()
