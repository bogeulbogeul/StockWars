import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text());frames=[1,20,34,40,46,52,58,70,91]
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-arm-clearance-v23/somangi-eat.blend'))
source=[]
for f in frames:
    bpy.context.scene.frame_set(f);source.append(points(bpy.data.objects['Somangi_SmoothBody']))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];mask=np.ones(len(source[0]),dtype=bool)
mask[meta['armRigidIds']['L']+meta['armRigidIds']['R']]=False
error=0.
for f,original in zip(frames,source):
    bpy.context.scene.frame_set(f);error=max(error,float(np.max(np.abs(points(body)[mask]-original[mask]))))
assert error<1e-6
(P/'body-verification.json').write_text(json.dumps({'samples':len(frames),'maximumNonArmPositionChange':error}));print('BODY ERROR',error)
