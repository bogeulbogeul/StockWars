import bpy,bmesh,json
from pathlib import Path
P=Path(__file__).resolve().parent;report={}
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-bread.blend'))
stages=[bpy.data.objects['Bread roll']]+[bpy.data.objects[f'Bread bite stage {i}'] for i in range(1,4)]
volumes=[]
for obj in stages:
    bm=bmesh.new();bm.from_mesh(obj.data);volumes.append(abs(bm.calc_volume()));bm.free()
assert all(a>b>0 for a,b in zip(volumes,volumes[1:])),volumes
visible=[]
for frame in [1,40,52,64,91]:
    bpy.context.scene.frame_set(frame)
    active=[i for i,o in enumerate(stages) if o.scale.x>.99]
    assert len(active)==1;visible.append(active[0])
assert visible==[0,1,2,3,3]
report['bread']={'stageVolumes':volumes,'remainingVolumeFractions':[v/volumes[0] for v in volumes],'stagesInOrder':True}
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-drink.blend'))
juice=bpy.data.objects['Juice surface'];levels=[]
for frame in [1,40,52,64,91]:
    bpy.context.scene.frame_set(frame);levels.append(juice.location.z)
assert levels[0]>levels[1]>levels[2]>levels[3] and abs(levels[3]-levels[4])<1e-6
report['drink']={'liquidLevels':levels,'cupSizeUnchanged':True}
(P/'food-validation.json').write_text(json.dumps(report,indent=2));print(report)
