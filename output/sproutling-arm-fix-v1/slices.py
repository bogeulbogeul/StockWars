import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'welded.blend'))
o=next(o for o in bpy.data.objects if o.type=='MESH')
for z in [-.15,-.25,-.35,-.45,-.55]:
 vs=[v.co for v in o.data.vertices if abs(v.co.z-z)<.008 and v.co.x>.15]
 print('SLICE',z,[(round(x,2),[round(min(v.y for v in vs if abs(v.x-x)<.025),3),round(max(v.y for v in vs if abs(v.x-x)<.025),3)]) for x in [.2,.3,.4,.5] if any(abs(v.x-x)<.025 for v in vs)])
