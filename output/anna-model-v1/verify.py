import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-rigged.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(mod.type=='ARMATURE' and mod.object==rig for mod in o.modifiers)]
report={'reimport_bones':len(rig.data.bones),'mesh_count':len(meshes),'all_vertices_weighted':bool(meshes) and all(len(v.groups)>0 for o in meshes for v in o.data.vertices),'embedded_face_image':any('face-basecolor' in i.name for i in bpy.data.images),'finite_vertices':all(all(math.isfinite(c) for c in v.co) for o in meshes for v in o.data.vertices)}
assert report['reimport_bones']==7 and report['all_vertices_weighted'] and report['embedded_face_image'] and report['finite_vertices'],report
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print(report)
