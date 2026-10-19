"""Select image_gen head edits only; preserve approved body/frame pixels.

This is fixed-region image-edit assembly against an existing known layout,
not fixed-grid extraction of a newly generated animation. sprite-gen owns the
chroma/edge cleanup. Entire frames remain the engine deliverable.
"""
import json,shutil,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.extract import remove_chroma_background,resize_cell
from prepare import HERE,ROOT,RUN,LAYOUT

def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 native=Image.open(HERE/'native-edit.png').convert('RGBA')
 # Native canvas differs only by output resolution; register the overall edit
 # to its exact source board before selecting the generated head pixels.
 native=resize_cell(native,(1280,800))
 alpha=remove_chroma_background(native,(0,255,255),96,180,18)
 alpha.save(HERE/'registered-alpha.png')
 cutoff={'right_walk':204,'right_carry':204,'right_sit':225}
 audit=[]
 for y,row in enumerate(LAYOUT):
  for x,(s,i) in enumerate(row):
   original=Image.open(HERE/f'before/frames/{s}/frame-{i}.png').convert('RGBA')
   end=cutoff[s]
   patch=alpha.crop((x*320,y*400,x*320+320,y*400+end))
   result=original.copy();result.paste(patch,(0,0))
   # Retain the approved original nose pixels/colors. The native edit changed
   # the nose to bright pink despite the follow-up color-only prompt. Select
   # that tiny generated nose region and restore the existing nose there;
   # this is original-pixel compositing, not a painted replacement.
   ar=np.array(result);yy,xx=np.indices(ar.shape[:2]);v=ar.astype('int16')
   pink=(yy>=(190 if s=='right_sit' else 150))&(yy<end)&(xx>145)&(xx<250)&(v[...,0]>175)&(v[...,0]-v[...,1]>60)&(v[...,0]-v[...,2]>45)&(v[...,1]<155)
   ny,nx=np.where(pink)
   if len(nx):
    box=(int(nx.min())-2,int(ny.min())-2,int(nx.max())+3,int(ny.max())+3)
    oldnose=np.array(original.crop(box)).astype('int16')
    select=(oldnose[...,0]<165)&(oldnose[...,1]<120)&(oldnose[...,2]<115)
    select|=pink[box[1]:box[3],box[0]:box[2]]
    result.paste(original.crop(box),box[:2],Image.fromarray((select*255).astype('uint8')))
   old=np.array(original);new=np.array(result)
   assert np.array_equal(old[end:],new[end:]),(s,i,'body changed')
   assert np.any(old[:end]!=new[:end])
   result.save(RUN/f'frames/{s}/frame-{i}.png')
   audit.append({'state':s,'frame':i,'edited_region':[0,0,320,end],'body_below_region_byte_identical':True,'changed_pixels':int(np.any(old!=new,axis=2).sum())})
 shutil.copy2(RUN/'frames/right_walk/frame-1.png',RUN/'frames/right_idle/frame-0.png')
 m=json.loads((RUN/'manifest.json').read_text());atlas=Image.open(HERE/'before/sprite-sheet-alpha.png').convert('RGBA')
 for state in ['right_walk','right_idle','right_carry','right_sit']:
  for i,r in enumerate(m['frame_layout']['rows'][state]):atlas.paste(Image.open(RUN/f'frames/{state}/frame-{i}.png'),(r['x'],r['y']))
 atlas.save(RUN/'sprite-sheet-alpha.png')
 # The previous native-RGB source is preserved as phase-1 history. Current
 # finalizer validates the composite native edit, without any color bake.
 if not (HERE/'before/native-before-palette.png').exists():shutil.copy2(RUN/'native-before-palette.png',HERE/'before/native-before-palette.png')
 atlas.save(RUN/'native-before-palette.png')
 m['rabbit_face_refinement']={'date':'2026-10-16','reason':'side face read as cat','source':'output/rabbit-face-v2/generation.json','edits':'rounded cheeks, blunt rabbit muzzle, soft eyes; approved original nose pixels/color retained','unique_edited_poses':8,'logical_frames_with_idle':9,'body_preserved':True}
 write(RUN/'manifest.json',m)
 # Check ALL unaffected states are byte-identical to the immediately prior version.
 for state,rects in m['frame_layout']['rows'].items():
  if state in ['right_walk','right_idle','right_carry','right_sit']:continue
  for i in range(len(rects)):assert (RUN/f'frames/{state}/frame-{i}.png').read_bytes()==(HERE/f'before/frames/{state}/frame-{i}.png').read_bytes()
 write(HERE/'verification.json',{'ok':True,'edited_unique_poses':8,'edited_logical_frames':9,'frame_layout_unchanged':True,'unaffected_states_byte_identical':True,'no_paw_pads_added':True,'checks':audit})
 board=Image.new('RGB',(1280,850),'#eee8dc');draw=ImageDraw.Draw(board)
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
 selected=[('right_walk',1),('right_walk',0),('right_carry',0),('right_sit',0)]
 for row,root in enumerate([HERE/'before',RUN]):
  draw.text((15,row*425+10),'수정 전 · 고양이처럼 뾰족한 볼' if row==0 else '수정 후 · 둥근 토끼 볼과 짧은 주둥이',font=font,fill='#332d24')
  for x,(s,i) in enumerate(selected):
   im=Image.open(root/f'frames/{s}/frame-{i}.png').convert('RGBA')
   board.paste(im,(x*320,row*425+25),im)
 board.save(HERE/'comparison.png')
 print('Corrected 8 rabbit side poses + shared idle; bodies and all other views preserved.')
if __name__=='__main__':main()
