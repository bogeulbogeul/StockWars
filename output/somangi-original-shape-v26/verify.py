import bpy,numpy as np,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
scene=bpy.context.scene;rig=bpy.data.objects['Somangi_RigidArms'];body=bpy.data.objects['Somangi_SmoothBody'];food=bpy.data.objects['bread_Prop']
report=json.loads((P/'preservation.json').read_text());n=report['originalOuterVertexCount']
base=np.array([v.co[:] for v in body.data.vertices]);scene.frame_set(1)
first={s:np.array(rig.pose.bones['Arm.'+s].matrix) for s in ['L','R']};maximum=0.
for i in range(115):
    f=1+i*.5;scene.frame_set(int(f),subframe=f-int(f))
    maximum=max(maximum,max(float(np.max(np.abs(np.array(rig.pose.bones['Arm.'+s].matrix)-first[s]))) for s in first))
scene.frame_set(91);rest=float(np.max(np.abs(points(body)[:n]-base[:n])))
assert maximum<1e-6 and rest<1e-6
stages=[];node=bpy.data.objects['Food_EqualBiteConsumption'];scene.frame_set(1);initial=np.array(food.scale)*np.array(node.scale)
for f in [1,40,52,58,91]:
    scene.frame_set(f);stages.append((np.array(food.scale)*np.array(node.scale)/initial).tolist())
assert np.allclose(stages,[[1]*3,[2/3]*3,[1/3]*3,[0]*3,[0]*3],atol=1e-6)
result=dict(holdingPoseSamples=115,maximumArmHoldingMatrixChange=maximum,finalOriginalSurfacePositionError=rest,sizeStages=stages)
(P/'fixed-hold-verification.json').write_text(json.dumps(result,indent=2));print(result)
