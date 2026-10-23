import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text());frames=meta['sampleFrames']
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-round-body-v20/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];source=[]
for f in frames:
    bpy.context.scene.frame_set(f);source.append(points(body))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
node=bpy.data.objects[meta['foodConsumptionNode']]
mask=np.ones(len(source[0]),dtype=bool)
for ids in meta['armRigidIds'].values():mask[ids]=False
unchanged=0.;rigid=0.;palm=0.;stages=[]
for j,f in enumerate(frames):
    bpy.context.scene.frame_set(f);actual=points(body)
    unchanged=max(unchanged,float(np.max(np.abs(actual[mask]-source[j][mask]))))
    for side,ids in meta['armRigidIds'].items():
        a=source[j][ids];b=actual[ids]
        rigid=max(rigid,float(np.max(np.abs(np.linalg.norm(a-a[0],axis=1)-np.linalg.norm(b-b[0],axis=1)))))
        palm=max(palm,float(np.linalg.norm(actual[meta['palmIds'][side]].mean(0)-meta['palmTargets'][j][side])))
bpy.context.scene.frame_set(1);initial=np.array(root.scale)
for f in [1,40,52,58,91]:
    bpy.context.scene.frame_set(f);stages.append((np.array(root.scale)*np.array(node.scale)/initial).tolist())
assert unchanged<1e-6 and rigid<1e-6 and palm<1e-6
assert np.allclose(stages,[[1]*3,[2/3]*3,[1/3]*3,[0]*3,[0]*3],atol=1e-6)
result=dict(unchangedBodyError=unchanged,armShapeError=rigid,palmTargetError=palm,sizeStages=stages)
(P/'verification.json').write_text(json.dumps(result,indent=2));print(result)
