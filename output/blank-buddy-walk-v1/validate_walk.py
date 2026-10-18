import bpy, json, math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=bpy.data.objects['Somangi_Body'];s=bpy.context.scene
foot_ids={side:[v.index for v in mesh.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
ground={side:min(mesh.data.vertices[i].co.z for i in ids) for side,ids in foot_ids.items()}
samples=[];positions={}
for f in range(1,26):
    s.frame_set(f);obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
    assert all(math.isfinite(c) for v in temp.vertices for c in v.co)
    if f in [1,25]:positions[f]=[v.co.copy() for v in temp.vertices]
    row={'frame':f}
    for side,offset in [('L',0),('R',.5)]:
        phase=((f-1)/24+offset)%1
        row[side]={'stance':phase<.5,'min_z':min(temp.vertices[i].co.z for i in foot_ids[side])}
    samples.append(row);obj.to_mesh_clear()
closure=max((a-b).length for a,b in zip(positions[1],positions[25]))
stance_error=max(abs(row[side]['min_z']-ground[side]) for row in samples for side in ['L','R'] if row[side]['stance'])
assert closure<1e-5
assert stance_error<.005
report={'frames_checked':25,'loop_closure_max_vertex_error':closure,'stance_foot_height_max_error':stance_error,'samples':samples}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-walk.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
m=next(o for o in bpy.context.scene.objects if o.type=='MESH')
assert len(arm.data.bones)==7
assert all(v.groups for v in m.data.vertices)
assert len(bpy.data.actions)==1
shader=next(n for n in m.data.materials[0].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
assert not shader.inputs['Normal'].links
report['roundtrip']={'bones':len(arm.data.bones),'actions':[a.name for a in bpy.data.actions],
 'normal_map_disconnected':True,'all_vertices_weighted':True,'embedded_images':sum(bool(i.packed_file) for i in bpy.data.images)}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('VALIDATED',json.dumps({k:v for k,v in report.items() if k!='samples'}))
