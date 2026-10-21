import bpy,json,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-motion.blend'));s=bpy.context.scene;body=bpy.data.objects['Anna_BaseBody'];rig=bpy.data.objects['Anna_Rig']
ids=[v.index for v in body.data.vertices if -.70<v.co.z<-.4 and abs(v.co.x)<.24];base={i:body.data.vertices[i].co.copy() for i in ids};error=0
for f in range(1,26):
 s.frame_set(f);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();root=rig.pose.bones['Root'].matrix@rig.pose.bones['Root'].bone.matrix_local.inverted()
 error=max(error,max((m.vertices[i].co-root@base[i]).length for i in ids));ev.to_mesh_clear()
assert error<1e-6,error
r=json.loads((P/'validation.json').read_text());r['lower_belly_vertices_checked']=len(ids);r['lower_belly_deformation_error']=error
for o in list(bpy.data.objects):
 if o.type in ['MESH','ARMATURE']:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'Anna-motion.glb'));rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');rig.animation_data.action=next(a for a in bpy.data.actions if a.name.startswith('Walk_InPlace') and a.users>0);s.frame_set(1)
cam=s.camera;cam.location=(0,-4,.25);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/'glb-reimport.png');bpy.ops.render.render(write_still=True)
(P/'validation.json').write_text(json.dumps(r,indent=2));print('BELLY_ERROR',error)
