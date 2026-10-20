import bpy,numpy as np,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-model-v2/Anna-rigged.blend'))
old=bpy.data.objects['Anna_Body'];vertices=np.array([v.co[:] for v in old.data.vertices]);weights=[[(g.group,g.weight) for g in v.groups] for v in old.data.vertices]
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-rigged.blend'))
o=bpy.data.objects['Anna_Body'];rig=bpy.data.objects['Anna_Rig'];s=bpy.context.scene
report={'vertices_identical':bool(np.array_equal(vertices,np.array([v.co[:] for v in o.data.vertices]))),'weights_identical':weights==[[(g.group,g.weight) for g in v.groups] for v in o.data.vertices]}
assert all(report.values()),report
bpy.data.objects.remove(o,do_unlink=True);bpy.data.objects.remove(rig,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-rigged.glb'))
rig=next(o for o in bpy.context.selected_objects if o.type=='ARMATURE');o=next(o for o in bpy.context.selected_objects if o.type=='MESH')
report.update({'bones':len(rig.data.bones),'all_vertices_weighted':all(v.groups for v in o.data.vertices),'vertex_colors_present':len(o.data.color_attributes)>0})
assert report['bones']==7 and report['all_vertices_weighted'] and report['vertex_colors_present'],report
cam=s.camera;cam.location=(0,-5,0);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.28;s.render.filepath=str(P/'reimport-front.png');bpy.ops.render.render(write_still=True)
(P/'reimport-validation.json').write_text(json.dumps(report,indent=2));print(report)
