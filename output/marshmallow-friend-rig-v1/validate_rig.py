import bpy, json, math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'marshmallow-friend-rig.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
results={}
for a in bpy.data.actions:
    rig.animation_data.action=a
    finite=True
    for frame in range(1,26):
        bpy.context.scene.frame_set(frame)
        evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
        temp=evaluated.to_mesh()
        finite &= all(math.isfinite(c) for v in temp.vertices for c in v.co)
        evaluated.to_mesh_clear()
    results[a.name]={'frames_checked':25,'finite_vertices':finite}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'marshmallow-friend-rig.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
results['export_roundtrip']={'bones':len(rig.data.bones),'vertex_groups':len(mesh.vertex_groups),
    'actions':[a.name for a in bpy.data.actions], 'materials':len(mesh.data.materials),
    'embedded_images':len([i for i in bpy.data.images if i.packed_file])}
assert len(rig.data.bones)==7
assert len(mesh.vertex_groups)>=6
assert all(v.groups for v in mesh.data.vertices)
assert all(r['finite_vertices'] for n,r in results.items() if n!='export_roundtrip')
(P/'validation.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
