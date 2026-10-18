import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'original.glb'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
original=[tuple(v.co) for v in mesh.data.vertices]
uv_original=[tuple(x.uv) for x in mesh.data.uv_layers.active.data]
materials=list(mesh.data.materials)
data=bpy.data.armatures.new('WalkSkeleton');rig=bpy.data.objects.new('SproutlingWalk',data);bpy.context.collection.objects.link(rig)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for name,a,b,parent in [('Root',(0,0,-.95),(0,0,-.75),None),('Body',(0,0,-.72),(0,0,-.1),'Root'),('Leg.L',(.14,0,-.72),(.14,0,-.93),'Root'),('Leg.R',(-.14,0,-.72),(-.14,0,-.93),'Root')]:
 bone=data.edit_bones.new(name);bone.head=a;bone.tail=b
 if parent:bone.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
groups={n:mesh.vertex_groups.new(name=n) for n in ['Body','Leg.L','Leg.R']}
for v in mesh.data.vertices:
 x,y,z=v.co;t=max(0,min(1,(-z-.66)/.09));leg=t*t*(3-2*t)
 groups['Body'].add([v.index],1-leg,'REPLACE')
 if leg:groups['Leg.L' if x>=0 else 'Leg.R'].add([v.index],leg,'REPLACE')
mod=mesh.modifiers.new('Walk only - original surface','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=True;mesh.parent=rig
s=bpy.context.scene;s.render.fps=24;s.frame_start=1;s.frame_end=24
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Walk')
floor=min(v.co.z for v in mesh.data.vertices);feet=[v.index for v in mesh.data.vertices if v.co.z<-.85]
def rotate(name,axis,angle):
 pb=rig.pose.bones[name];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION';pb.rotation_quaternion=q.inverted()@Quaternion(axis,angle)@q
for frame in range(1,26):
 phase=(frame-1)*math.tau/24;wave=math.sin(phase)
 rotate('Leg.L',(1,0,0),math.radians(10)*wave);rotate('Leg.R',(1,0,0),-math.radians(10)*wave)
 rotate('Body',(0,1,0),math.radians(.7)*wave)
 root=rig.pose.bones['Root'];root.location=(0,0,0);bpy.context.view_layer.update()
 ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());root.location.z=floor-min(ev.data.vertices[i].co.z for i in feet)
 for pb in rig.pose.bones:
  pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert(data_path='location',frame=frame,group=pb.name)
s.frame_set(1)
assert original==[tuple(v.co) for v in mesh.data.vertices]
assert uv_original==[tuple(x.uv) for x in mesh.data.uv_layers.active.data]
assert materials==list(mesh.data.materials)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(P/'sproutling-walk.glb'),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='ACTIONS')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'sproutling-walk.blend'))
s.render.engine='CYCLES';s.cycles.samples=8;s.render.resolution_x=460;s.render.resolution_y=460;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.4,.4,.4,1)
for pos,power in [((2,-4,4),450),((-3,-1,1),180)]:
 bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=power;light.data.size=4;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-6,.25));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.2;s.camera=cam
(P/'frames').mkdir(exist_ok=True)
for frame in range(1,25,2):
 s.frame_set(frame);s.render.filepath=str(P/'frames'/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
report={'geometry_unchanged':True,'uv_unchanged':True,'materials_unchanged':True,'walk_only':True,'vertices':len(original),'arm_separation':False,'duration_seconds':1,'foot_swing_degrees':10}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'sproutling-walk.glb'))
report['export_reimport']=any(o.type=='ARMATURE' for o in bpy.data.objects) and len(bpy.data.actions)==1
(P/'validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
