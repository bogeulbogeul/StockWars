"""Scale check using the game's Somangi at height 100, model-room unit = 100."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-furnished-room-v1/Bank-furnished-room.blend'))
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent.parent/'web/assets/characters/3d/somangi/wave.glb'))
added=set(bpy.data.objects)-before
scene=bpy.context.scene;scene.frame_set(1);bpy.context.view_layer.update()
# Snapshot the imported neutral first pose as static meshes; retain runtime's 1/1.95 ratio.
deps=bpy.context.evaluated_depsgraph_get();snap=[]
for o in added:
 if o.type!='MESH' or o.name not in scene.objects or o.name.startswith('Icosphere'):continue
 ev=o.evaluated_get(deps);mesh=bpy.data.meshes.new_from_object(ev,depsgraph=deps)
 mesh.transform(o.matrix_world)
 ob=bpy.data.objects.new('Somangi_Scale_Mesh',mesh);scene.collection.objects.link(ob);snap.append(ob)
for o in added:bpy.data.objects.remove(o,do_unlink=True)
pts=[v.co for o in snap for v in o.data.vertices];bottom=min(p.z for p in pts)
for o in snap:
 for v in o.data.vertices:v.co=Vector((v.co.x/1.95,v.co.y/1.95,(v.co.z-bottom)/1.95))
heights=max(v.co.z for o in snap for v in o.data.vertices)
locations=[('Desk',(0,-.95,.024)),('Sofa',(-2.15,-.80,.024)),('Safe',(2.70,1.04,.024))]
for idx,(name,loc) in enumerate(locations):
 root=bpy.data.objects.new('Somangi_'+name,None);scene.collection.objects.link(root);root.location=loc
 for source in snap:
  ob=source.copy();ob.data=source.data;scene.collection.objects.link(ob);ob.parent=root
for o in snap:bpy.data.objects.remove(o,do_unlink=True)
scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.cycles.samples=48
scene.render.filepath=str(ROOT/'room-scale.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-scale-check.blend'))
# Inspection camera near sofa and desk, preserves the source room file.
cam=scene.camera;target=Vector((-1.45,-.1,.6));cam.location=target+Vector((2,-6,3.8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.0
scene.render.filepath=str(ROOT/'furniture-scale.png');bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'basis':'game SOMANGI_HEIGHT=100 and source divisor=1.95; assumed room model unit=100 game units','measured_pose_height':heights,'sofa_seat_top':.010+.5165*.70*1.22,'desk_top':.790,'safe_top':.024+1.455*1.10,'window_sill':.94,'two_seat_width':1.61*1.22,'placements':locations,'status':'visual proportion check; no sitting pose or runtime collision verification'},indent=2),encoding='utf-8')
