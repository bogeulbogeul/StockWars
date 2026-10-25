import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-sideways.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];raw=np.array([v.co[:] for v in body.data.vertices])
parts=[[v.index for v in body.data.vertices if v.co.z<-.78 and v.co.x*s>0][::41] for s in [1,-1]]
upper=[v.index for v in body.data.vertices if v.co.z>-.5][::137]
errors=[];feet=[];poses=[]
for frame in range(1,32):
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();p=np.array([v.co[:] for v in mesh.vertices]);ev.to_mesh_clear();feet.append(float(p[:,2].min()));poses.append(p)
 for indices in parts+[upper]:errors.append(float(abs(np.linalg.norm(p[indices]-p[indices[0]],axis=1)-np.linalg.norm(raw[indices]-raw[indices[0]],axis=1)).max()))
report=dict(frames=31,maxShapeError=max(errors),footRange=max(feet)-min(feet),loopError=float(abs(poses[0]-poses[-1]).max()))
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rear-junction-v43/somangi-eat.blend'))
report['originalRestCoordinatesIdentical']=bool(np.array_equal(raw,np.array([v.co[:] for v in bpy.data.objects['Somangi_SmoothBody'].data.vertices])))
print(report);(P/'verification.json').write_text(json.dumps(report,indent=2))
assert report['originalRestCoordinatesIdentical'];assert max(errors)<1e-5;assert report['loopError']<1e-5;assert report['footRange']<1e-5
