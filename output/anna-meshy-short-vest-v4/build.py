import bpy,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v3/Anna-meshy-short-vest.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];o=bpy.data.objects['Anna_Vest'];rig.data.pose_position='REST';bpy.context.view_layer.update();tree=BVHTree.FromObject(bpy.data.objects['Eating_Torso'],bpy.context.evaluated_depsgraph_get());inv=o.matrix_world.inverted()
# Preserve shell thickness: retain 55% of each existing radial gap, plus clearance.
for v in o.data.vertices:
 q=o.matrix_world@v.co;c=Vector((0,-.01,q.z));d=q-c;r=d.length
 if r<1e-6:continue
 direction=d/r;hit,normal,index,dist=tree.ray_cast(c,direction,2)
 if hit is None:continue
 gap=r-dist
 t=max(0,min(1,(-q.z-.16)/.16));t=t*t*(3-2*t)
 if gap>.018:q-=direction*((gap-.018)*.45*t)
 v.co=inv@q
rig.data.pose_position='POSE';cam=s.camera;target=Vector((0,0,.1));cam.data.ortho_scale=2.6;s.render.resolution_x=700;s.render.resolution_y=700
for name,action,frame,pos in [('front','Walk_InPlace',7,(0,-5,.3)),('side','Walk_InPlace',7,(5,0,.3)),('seated','Seated',1,(2.8,-5,.6))]:
 rig.animation_data.action=bpy.data.actions[action];s.frame_set(frame);cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-meshy-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-meshy-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-meshy-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
s.render.resolution_x=420;s.render.resolution_y=420;cam.location=(2.8,-5,.5);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for action,count,step,prefix in [('Walk_InPlace',25,2,'walk'),('Sit_Demo',97,4,'sit')]:
 rig.animation_data.action=bpy.data.actions[action]
 for f in range(1,count,step):s.frame_set(f);s.render.filepath=str(P/(prefix+'-%03d.png'%f));bpy.ops.render.render(write_still=True)
