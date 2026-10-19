import json,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from sprite_gen.frames.extract import remove_chroma_background,resize_cell
from prepare import HERE,ROOT,RUN,LAYOUT
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 face=remove_chroma_background(resize_cell(Image.open(HERE/'native-face.png').convert('RGBA'),(960,800)),(0,255,255),96,180,18)
 audit=[]
 for y,row in enumerate(LAYOUT):
  for x,(s,i) in enumerate(row):
   if s=='right_idle':continue
   old=Image.open(HERE/f'before/frames/{s}/frame-{i}.png').convert('RGBA');end=400 if s=='face_portrait' else 225 if s=='down_sit' else 204
   new=old.copy();new.paste(face.crop((x*320,y*400,x*320+320,y*400+end)),(0,0))
   assert old.crop((0,end,320,400)).tobytes()==new.crop((0,end,320,400)).tobytes()
   new.save(RUN/f'frames/{s}/frame-{i}.png');audit.append({'state':s,'frame':i,'region':[0,0,320,end],'outside_exact':True})
 shutil.copy2(RUN/'frames/down_walk/frame-1.png',RUN/'frames/down_idle/frame-0.png')
 carry=Image.open(HERE/'native-carry.png').convert('RGBA');a=np.array(carry)
 # The native edit added a white outer canvas border. Remove only all-white
 # margin rows/columns, then register the existing row to its original size.
 nonwhite=~(a[...,:3]>240).all(-1);ys,xs=np.where(nonwhite)
 carry=resize_cell(carry.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)),(1280,400))
 carry=remove_chroma_background(carry,(0,255,255),96,180,18);carry.save(HERE/'registered-carry.png')
 boxes=[[125,248,198,292],[125,248,190,289],[125,248,198,316],[125,248,185,292]]
 for i,(x0,y0,x1,y1) in enumerate(boxes):
  old=np.array(Image.open(HERE/f'before/frames/right_carry/frame-{i}.png').convert('RGBA'));new=old.copy();patch=np.array(carry.crop((i*320,0,i*320+320,400)))
  mask=np.zeros((400,320),dtype=bool);mask[y0:y1,x0:x1]=True
  mask&=(old[...,3]==255)&(patch[...,3]==255)
  # Keep original dark limb separation strokes; only fur/cream interiors change.
  mask&=old[...,:3].max(-1)>100
  new[mask,:3]=patch[mask,:3]
  assert np.array_equal(new[...,3],old[...,3]);assert np.array_equal(new[~mask],old[~mask])
  Image.fromarray(new).save(RUN/f'frames/right_carry/frame-{i}.png')
  Image.fromarray((mask*255).astype('uint8')).save(HERE/f'carry-mask-{i}.png')
  audit.append({'state':'right_carry','frame':i,'region':[x0,y0,x1,y1],'outside_exact':True,'alpha_exact':True})
 m=json.loads((RUN/'manifest.json').read_text());atlas=Image.open(HERE/'before/sprite-sheet-alpha.png').convert('RGBA')
 for s,rects in m['frame_layout']['rows'].items():
  for i,r in enumerate(rects):atlas.paste(Image.open(RUN/f'frames/{s}/frame-{i}.png'),(r['x'],r['y']))
 atlas.save(RUN/'sprite-sheet-alpha.png');atlas.save(RUN/'native-before-palette.png')
 m['rabbit_all_face_and_legs']={'source':'output/rabbit-unified-v3/generation.json','front_faces':'rounded rabbit cheeks/muzzle matching corrected side','carry_legs':'no cream patches on lower belly/groin/thighs; chest/hands/feet/tail retained','layout_and_timing_unchanged':True};write(RUN/'manifest.json',m)
 for s in ['right_walk','right_idle','right_sit','up_walk','up_idle']:
  for p in (HERE/'before/frames'/s).glob('frame-*.png'):assert p.read_bytes()==(RUN/'frames'/s/p.name).read_bytes()
 write(HERE/'verification.json',{'ok':True,'edited_unique_poses':9,'edited_logical_frames':10,'unaffected_states_exact':True,'checks':audit})
 board=Image.new('RGB',(1600,850),'#eee8dc');d=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',21)
 poses=[('down_walk',1),('down_sit',0),('face_portrait',0),('right_carry',0),('right_carry',2)]
 for row,root in enumerate([HERE/'before',RUN]):
  d.text((15,row*425+5),'수정 전' if row==0 else '수정 후 · 얼굴 통일 / 다리 흰 무늬 제거',font=font,fill='#332d24')
  for x,(s,i) in enumerate(poses):
   im=Image.open(root/f'frames/{s}/frame-{i}.png').convert('RGBA');board.paste(im,(x*320,row*425+25),im)
 board.save(HERE/'comparison.png')
 print('Updated front faces/portrait + four carry leg patches; protected pixels verified.')
if __name__=='__main__':main()
