import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Blank_Buddy_1018040345_generate.glb')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
mesh.name='Buddy_Original'
original=[tuple(v.co) for v in mesh.data.vertices]
for f in mesh.data.polygons:f.use_smooth=True
for e in mesh.data.edges:e.use_edge_sharp=False
if mesh.data.has_custom_normals:mesh.data.normals_split_custom_set([(0,0,0)]*len(mesh.data.loops))
mat=bpy.data.materials.new('White');mat.diffuse_color=(.9,.9,.9,1)
mesh.data.materials.clear();mesh.data.materials.append(mat)
data=bpy.data.armatures.new('Simple_Skeleton');rig=bpy.data.objects.new('Buddy_Rig',data)
bpy.context.collection.objects.link(rig)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
spec={
 'Root':((0,0,-.95),(0,0,-.75),None),
 'Body':((0,0,-.56),(0,0,-.10),'Root'),
 'Head':((0,0,0),(0,0,.7),'Body'),
 'Arm.L':((.31,0,-.075),(.55,0,-.43),'Body'),
 'Arm.R':((-.31,0,-.075),(-.55,0,-.43),'Body'),
 'Leg.L':((.20,0,-.56),(.20,0,-.89),'Root'),
 'Leg.R':((-.20,0,-.56),(-.20,0,-.89),'Root')}
for name,(a,b,parent) in spec.items():
    bone=data.edit_bones.new(name);bone.head=a;bone.tail=b
    if parent:bone.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
groups={n:mesh.vertex_groups.new(name=n) for n in spec}
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
for v in mesh.data.vertices:
    x,y,z=v.co;ax=abs(x);side='L' if x>=0 else 'R'
    head=smooth(-.025,.035,z)
    # Follow the diagonal arm/body separation, without moving the head.
    boundary=.30+max(0,-z-.08)*.28
    arm=smooth(boundary,boundary+.105,ax)*(1-head)
    leg=smooth(-.49,-.70,z)*smooth(.015,.13,ax)
    weights={'Head':head,'Arm.'+side:arm*(1-head),
             'Leg.'+side:leg*(1-head)*(1-arm)}
    weights['Body']=max(0,1-sum(weights.values()))
    total=sum(weights.values())
    for n,w in weights.items():
        if w>0:groups[n].add([v.index],w/total,'REPLACE')
mod=mesh.modifiers.new('Gentle skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=True
mesh.parent=rig
def rotate(n,deg,axis=(1,0,0)):
    pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion()
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Walk_Gentle')
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=32
feet=[v.index for v in mesh.data.vertices if v.co.z<-.79]
floor_z=min(v.co.z for v in mesh.data.vertices)
for frame in range(1,34):
    s=math.sin((frame-1)*math.tau/32)
    rotate('Leg.L',8*s);rotate('Leg.R',-8*s)
    rotate('Arm.L',-5*s);rotate('Arm.R',5*s)
    rotate('Body',.6*s,(0,1,0));rotate('Head',-.6*s,(0,1,0))
    rig.pose.bones['Root'].location=(0,0,0);bpy.context.view_layer.update()
    ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    rig.pose.bones['Root'].location.z=floor_z-min(ev.data.vertices[i].co.z for i in feet)
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=frame,group=pb.name)
scene.frame_set(1)
bpy.ops.object.camera_add(location=(2,-7,1.15));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=2.35;scene.camera=cam
scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO'
scene.display.shading.studio_light='paint.sl';scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=False
scene.display.shading.background_type='WORLD'
world=bpy.data.worlds.new('Grey');world.color=(.24,.26,.28);scene.world=world
scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-gentle-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-gentle-walk.glb'),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='ACTIONS')
folder=P/'frames';folder.mkdir(exist_ok=True)
for f in range(1,33,2):
    scene.frame_set(f);scene.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
assert original==[tuple(v.co) for v in mesh.data.vertices]
assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in mesh.data.vertices)
print('VALIDATED: original geometry unchanged; normalized skin weights; walking only')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'buddy-gentle-walk.glb'))
assert len(bpy.data.actions)==1
assert len(next(o for o in bpy.context.scene.objects if o.type=='ARMATURE').data.bones)==7
(P/'validation.json').write_text(json.dumps({'original_vertices_unchanged':True,'weights_normalized':True,'export_reimport':True,'actions':['Walk_Gentle'],'bones':7},indent=2))
