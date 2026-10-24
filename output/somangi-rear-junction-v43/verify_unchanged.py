import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody']
with bpy.data.libraries.load(str(P.parent/'somangi-local-shoulder-v42/somangi-eat.blend')) as (src,dst):
 dst.objects=['Somangi_SmoothBody','Somangi_WholeArmRig']
for ob in dst.objects:bpy.context.scene.collection.objects.link(ob)
reference=next(ob for ob in dst.objects if ob.type=='MESH')
assert len(body.data.vertices)==len(reference.data.vertices)
assert [tuple(f.vertices) for f in body.data.polygons]==[tuple(f.vertices) for f in reference.data.polygons]
assert all(a.co==b.co for a,b in zip(body.data.vertices,reference.data.vertices))
assert all([(g.group,g.weight) for g in a.groups]==[(g.group,g.weight) for g in b.groups] for a,b in zip(body.data.vertices,reference.data.vertices))
error=0.
for k in range(271):
 f=1+k*.5;bpy.context.scene.frame_set(int(f),subframe=f-int(f));error=max(error,float(np.max(np.abs(points(body)-points(reference)))))
result=dict(vertices=len(body.data.vertices),topologyUnchanged=True,restCoordinatesUnchanged=True,weightsUnchanged=True,animationSamples=271,maximumAnimatedPositionChange=error)
(P/'unchanged.json').write_text(json.dumps(result,indent=2));print(result);assert error<1e-7
