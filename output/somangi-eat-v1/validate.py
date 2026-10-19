import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
s=bpy.context.scene;mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig'];food=bpy.data.objects['Food_Bun']
original=[tuple(v.co) for v in mesh.data.vertices]
core=[v.index for v in mesh.data.vertices if -.60<v.co.z<-.25 and abs(v.co.x)<.23]
leg_ids=[v.index for v in mesh.data.vertices if v.co.z<-.73]
ends={};belly=0;legs=0
for f in range(1,74):
    s.frame_set(f);obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
    assert all(math.isfinite(c) for v in temp.vertices for c in v.co)
    belly=max(belly,max((temp.vertices[i].co-mesh.data.vertices[i].co).length for i in core))
    legs=max(legs,max((temp.vertices[i].co-mesh.data.vertices[i].co).length for i in leg_ids))
    if f in [1,73]:ends[f]=[v.co.copy() for v in temp.vertices]
    obj.to_mesh_clear()
    assert all(abs(c-1)<1e-7 for bone in rig.pose.bones for c in bone.scale)
    for side in ['L','R']:assert rig.pose.bones['Leg.'+side].location.length<1e-7
loop=max((a-b).length for a,b in zip(ends[1],ends[73]))
assert legs<1e-5 and loop<1e-5
assert all(v.groups for v in mesh.data.vertices)
report={'frames':73,'loop_error':loop,'stationary_leg_error':legs,'belly_core_displacement':belly,
 'body_vertex_count':len(mesh.data.vertices),'bones':len(rig.data.bones),'duration':3,'fps':24,
 'known_limit':'Visible shoulder/underarm creases remain in raised pose. Mouth stays fixed; prop is not consumed.'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
source=bpy.data.objects['Somangi_Body']
report['source_mesh_positions_unchanged']=original==[tuple(v.co) for v in source.data.vertices]
assert report['source_mesh_positions_unchanged']
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
assert len(rig.data.bones)==8 and any(a.name=='Eat' for a in bpy.data.actions)
report['roundtrip']={'meshes':[o.name for o in bpy.context.scene.objects if o.type=='MESH'],'bones':8,'clip':'Eat'}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
