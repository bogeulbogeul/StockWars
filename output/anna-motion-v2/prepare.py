from pathlib import Path
p=Path('C:/GitHub/StockWars/output')
s=(p/'anna-motion-v1/build.py').read_text(encoding='utf-8-sig')
s=s.replace('pitch=sign*math.cos(t*math.tau)*20 if walk else 0', '''phase=(t+(0 if side=='L' else .5))%1
  if phase<.5:pitch=-24+96*phase
  else:
   u=(phase-.5)*2;pitch=24-48*(u*u*(3-2*u))
  if not walk:pitch=0''')
s=s.replace('swing=-sign*math.cos(t*math.tau)*16 if walk else 0','swing=sign*math.cos(t*math.tau)*18 if walk else 0')
s=s.replace("for f in range(1,25,2):\n s.frame_set(f);s.render.filepath=str(P/('frame-%02d.png'%f));bpy.ops.render.render(write_still=True)",'''for view,pos in [('front',(0,-4,.25)),('side',(4,0,.25))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
 for f in range(1,25,2):
  s.frame_set(f);s.render.filepath=str(P/(view+'-%02d.png'%f));bpy.ops.render.render(write_still=True)''')
(p/'anna-motion-v2/build.py').write_text(s,encoding='utf-8')
