import bpy,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
S=P.parent/'somangi-eat-unbent-v35'
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;scene.frame_set(91);body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig']
original=np.array([v.co[:] for v in body.data.vertices]);report={}
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return float(t*t*t*(10-15*t+6*t*t))
for name in ['Arm.L','Arm.R']:
    group=body.vertex_groups[name];ids=[v.index for v in body.data.vertices if any(g.group==group.index and g.weight>.999 for g in v.groups)];changed=[]
    for i in ids:
        z=body.data.vertices[i].co.z
        weight=smooth(.055,.155,-z)
        if weight>.999999:continue
        group.remove([i]);body.vertex_groups['Body'].add([i],1-weight,'REPLACE')
        if weight>1e-6:group.add([i],weight,'REPLACE')
        changed.append(i)
    report[name]=dict(connectionVertices=len(changed),ids=changed)
neck=[];body_group=body.vertex_groups['Body'];head_group=body.vertex_groups['Head']
for vertex in body.data.vertices:
    portion=next((g.weight for g in vertex.groups if g.group==body_group.index),0)
    if portion<1e-6:continue
    x,y,z=vertex.co;radius=max(abs(x)/.33,abs(y)/.20)
    weight=smooth(-.10,-.015,z)*(1-smooth(.85,1.2,radius))*portion
    if weight<1e-6:continue
    body_group.remove([vertex.index])
    if portion-weight>1e-6:body_group.add([vertex.index],portion-weight,'REPLACE')
    head_group.add([vertex.index],weight,'REPLACE');neck.append(vertex.index)
report['Neck']=dict(connectionVertices=len(neck),ids=neck)
# No new joints, shapes or scales; only the narrow attachment weights change.
assert [b.name for b in rig.data.bones]==['Body','Arm.L','Arm.R','Head']
assert np.max(np.abs(original-np.array([v.co[:] for v in body.data.vertices])))==0
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','SoftConnections_WholeArmEat')
(P/'connections.json').write_text(json.dumps(report,indent=2))
