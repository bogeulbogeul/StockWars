import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body']
sole={side:[v.index for v in mesh.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
ground={side:min(mesh.data.vertices[i].co.z for i in ids) for side,ids in sole.items()}
edges=[(a,b,(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length) for e in mesh.data.edges for a,b in [e.vertices] if mesh.data.vertices[a].co.z<-.73 and mesh.data.vertices[b].co.z<-.73]
core=[v.index for v in mesh.data.vertices if -.63<v.co.z<-.20 and abs(v.co.x)<.27]
rest_bone_lengths={n:rig.data.bones[n].length for n in ['Leg.L','Leg.R']}
max_edge=0;max_contact=0;min_clearance=1;belly=0;ends={};max_translation=0
for f in range(1,26):
    s.frame_set(f);obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
    assert all(math.isfinite(c) for v in temp.vertices for c in v.co)
    foot_clearances=[]
    for side in ['L','R']:
        pb=rig.pose.bones['Leg.'+side];max_translation=max(max_translation,pb.location.length)
        assert abs(pb.length-rest_bone_lengths['Leg.'+side])<1e-6
        assert all(abs(c-1)<1e-7 for c in pb.scale)
        z=min(temp.vertices[i].co.z for i in sole[side]);phase=((f-1)/24+(0 if side=='L' else .5))%1
        foot_clearances.append(z-min(ground.values()))
        min_clearance=min(min_clearance,z-min(ground.values()))
    max_contact=max(max_contact,abs(min(foot_clearances)))
    for a,b,length in edges:
        max_edge=max(max_edge,abs((temp.vertices[a].co-temp.vertices[b].co).length-length))
    transform=rig.pose.bones['Body'].matrix@rig.data.bones['Body'].matrix_local.inverted()
    belly=max(belly,max((temp.vertices[i].co-transform@mesh.data.vertices[i].co).length for i in core))
    if f in [1,25]:ends[f]=[v.co.copy() for v in temp.vertices]
    obj.to_mesh_clear()
closure=max((a-b).length for a,b in zip(ends[1],ends[25]))
assert max_translation<1e-7
assert max_edge<1e-5
assert max_contact<.002
assert min_clearance>-.002
assert belly<1e-5
assert closure<1e-5
report={'leg_translation':max_translation,'rigid_leg_edge_length_error':max_edge,'belly_deformation':belly,
 'stance_height_error':max_contact,'minimum_sole_clearance':min_clearance,'loop_error':closure,'frames':25}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-walk.glb'))
assert any(a.name=='Walk_InPlace' for a in bpy.data.actions)
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
assert len(arm.data.bones)==7
report['glb_roundtrip_bones']=7
(P/'validation.json').write_text(json.dumps(report,indent=2));print('VALIDATED',json.dumps(report))
