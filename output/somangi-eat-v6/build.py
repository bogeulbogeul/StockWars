import bpy,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-v5/somangi-eat.blend'))
s=bpy.context.scene;torso=bpy.data.objects['Eating_Torso'];before=[v.co.copy() for v in torso.data.vertices]
with bpy.data.libraries.load(str(P.parent/'somangi-wave-v3/somangi-wave.blend'),link=False) as (source,target):target.meshes=['Smooth stable torso']
reference=target.meshes[0];assert len(reference.vertices)==len(torso.data.vertices)
for a,b in zip(torso.data.vertices,reference.vertices):a.co=b.co
report={'reference':'somangi-wave-v3','vertex_count':len(before),'max_adjustment':max((a-v.co).length for a,v in zip(before,torso.data.vertices)),'animation_changed':False,'face_hands_food_changed':False,'torso_matches_wave':all(tuple(a.co)==tuple(b.co) for a,b in zip(torso.data.vertices,reference.vertices))}
assert report['torso_matches_wave'];bpy.data.meshes.remove(reference);torso.data.update()
(P/'belly-repair.json').write_text(json.dumps(report,indent=2))
s.frame_set(34);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.1,0))
for name,pos in [('eat-front',(0,-6,0)),('eat-side',(6,-.1,0)),('eat-angle',(2.5,-6,.7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Food_Bun','Mouth_Animated']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Somangi_Rig']
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE',export_cameras=False,export_lights=False)
sys.path.insert(0,str(P.parent/'somangi-eat-v4'));from merge_clips import merge_clips
merge_clips(P/'somangi-eat.glb');print('BELLY_MATCH',json.dumps(report))
