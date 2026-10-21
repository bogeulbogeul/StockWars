import bpy,json,math,hashlib,struct
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-sit-v1/Anna-sit.blend'));s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];bpy.data.objects.remove(bpy.data.objects['Anna_Vest'],do_unlink=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/AnnaVest.glb');o=next(o for o in bpy.context.selected_objects if o.type=='MESH');o.name='Anna_Vest'
raw=[tuple(v.co) for v in o.data.vertices]
for v in o.data.vertices:
 t=max(0,min(1,(v.co.z+.4)/.8));t=t*t*(3-2*t);v.co.y*=.78+.22*t
 z=v.co.z*.41-.22
 a=max(0,min(1,(z+.40)/.22));a=a*a*(3-2*a)
 b=max(0,min(1,(z-.02)/.10));b=b*b*(3-2*b)
 v.co.x*=1+.14*a*(1-b)
o.scale=(.47,.78,.41);o.location=(0,-.015,-.22);bpy.context.view_layer.update();world=o.matrix_world.copy();o.parent=rig;o.matrix_world=world
g=o.vertex_groups.new(name='Body');g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Follow shared body','ARMATURE');mod.object=rig
s.render.resolution_x=700;s.render.resolution_y=700;cam=s.camera;cam.data.ortho_scale=2.6;target=Vector((0,0,.1))
for name,action,frame,pos in [('front','Walk_InPlace',7,(0,-5,.3)),('side','Walk_InPlace',7,(5,0,.3)),('back','Walk_InPlace',7,(0,5,.3)),('seated','Seated',1,(2.8,-5,.6))]:
 rig.animation_data.action=bpy.data.actions[action];s.frame_set(frame);cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-meshy-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-meshy-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-meshy-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
assert all(abs(a[2]-v.co.z)<1e-7 for a,v in zip(raw,o.data.vertices))
(P/'validation.json').write_text(json.dumps({'original_vest_length_and_topology_preserved':True,'upper_torso_width_clearance':.14,'fit_method':'scale, translation, smooth depth clearance only','scale':list(o.scale),'location':list(o.location)},indent=2))
s.render.resolution_x=420;s.render.resolution_y=420;cam.location=(2.8,-5,.5);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for action,count,step,prefix in [('Walk_InPlace',25,2,'walk'),('Sit_Demo',97,4,'sit')]:
 rig.animation_data.action=bpy.data.actions[action]
 for f in range(1,count,step):s.frame_set(f);s.render.filepath=str(P/(prefix+'-%03d.png'%f));bpy.ops.render.render(write_still=True)
