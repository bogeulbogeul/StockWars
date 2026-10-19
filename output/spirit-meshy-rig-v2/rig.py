import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Quaternion

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'source.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
mesh.name='Buddy_Original_Mesh'
original=[tuple(v.co) for v in mesh.data.vertices]
original_faces=[tuple(f.vertices) for f in mesh.data.polygons]
for o in bpy.context.selected_objects:o.select_set(False)
mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
mesh.vertex_groups.clear()
for mod in list(mesh.modifiers):
    if mod.type=='ARMATURE':mesh.modifiers.remove(mod)
white=bpy.data.materials.new('White - customizable body color')
white.diffuse_color=(.91,.91,.91,1);white.use_nodes=True
shader=white.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.91,.91,.91,1)
shader.inputs['Roughness'].default_value=.8
mesh.data.materials.clear();mesh.data.materials.append(white)
for f in mesh.data.polygons:f.use_smooth=True
for edge in mesh.data.edges:edge.use_edge_sharp=False
if mesh.data.has_custom_normals:
    mesh.data.normals_split_custom_set([(0,0,0)]*len(mesh.data.loops))

armature=bpy.data.armatures.new('Buddy_Tpose_Skeleton')
rig=bpy.data.objects.new('Buddy_Rig',armature);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
spec={
    'Root':((0,0,-.95),(0,0,-.75),None),
    'Body':((0,.03,-.57),(0,.03,-.12),'Root'),
    'Head':((0,0,-.02),(0,0,.7),'Body'),
    'Arm.L':((.345,.03,-.115),(.785,.03,-.105),'Body'),
    'Arm.R':((-.345,.03,-.115),(-.785,.03,-.105),'Body'),
    'Leg.L':((.205,.03,-.565),(.225,.03,-.88),'Root'),
    'Leg.R':((-.205,.03,-.565),(-.225,.03,-.88),'Root')}
for name,(head,tail,parent) in spec.items():
    bone=armature.edit_bones.new(name);bone.head=head;bone.tail=tail
    if parent:bone.parent=armature.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front=True;armature.display_type='OCTAHEDRAL'
groups={name:mesh.vertex_groups.new(name=name) for name in spec}

def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)))
    return t*t*(3-2*t)

# Only shoulders/hips blend; limb ends are rigidly assigned to a single bone.
for v in mesh.data.vertices:
    x,y,z=v.co;ax=abs(x);side='L' if x>=0 else 'R'
    weights={}
    if z>=.055:
        weights['Head']=1
    else:
        arm=smooth(.31,.49,ax) if -.29<z<.055 else 0
        # No arm influence on the lower spherical head/neck.
        if z>.005 and ax<.49:arm*=1-smooth(.005,.055,z)
        leg=smooth(-.52,-.69,z) if z<-.52 else 0
        if arm>0:weights['Arm.'+side]=arm
        remaining=1-arm
        if leg>0:
            weights['Leg.'+side]=remaining*leg
            weights['Body']=remaining*(1-leg)
        else:
            head=smooth(-.055,.025,z)
            weights['Head']=remaining*head;weights['Body']=remaining*(1-head)
    total=sum(weights.values())
    for name,w in weights.items():
        if w>1e-7:groups[name].add([v.index],w/total,'REPLACE')
modifier=mesh.modifiers.new('Skin - shoulder and hip blending only','ARMATURE')
modifier.object=rig;modifier.use_deform_preserve_volume=True
mesh.parent=rig

def set_rotation(name,q):
    pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=basis.inverted() @ q @ basis

def rot(name,axis,angle):set_rotation(name,Quaternion(axis,math.radians(angle)))

def reset():
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)

def idle(t):
    rot('Arm.L',(0,1,0),65);rot('Arm.R',(0,1,0),-65)

def walk(t):
    s=math.sin(t*math.tau)
    rot('Leg.L',(1,0,0),s*14);rot('Leg.R',(1,0,0),-s*14)
    for side,sign in [('L',1),('R',-1)]:
        q=Quaternion((1,0,0),math.radians(-sign*s*12)) @ Quaternion((0,1,0),math.radians(sign*65))
        set_rotation('Arm.'+side,q)
    rig.pose.bones['Root'].location.z=.008*(1-math.cos(t*math.tau*2))

def wave(t):
    idle(t);lift=min(1,t*5,(1-t)*5)
    rot('Arm.L',(0,1,0),65-lift*(105+8*math.sin(t*math.tau*3)))

def eat(t):
    idle(t);lift=(1-math.cos(t*math.tau))/2
    start=Quaternion((0,1,0),math.radians(-65))
    target=Vector((-1,0,.023)).rotation_difference(Vector((.43,-.85,.24)).normalized())
    set_rotation('Arm.R',start.slerp(target,lift))

def action(name,count,fn):
    rig.animation_data_create();rig.animation_data.action=None
    a=bpy.data.actions.new(name);rig.animation_data.action=a
    for frame in range(1,count+1):
        reset();fn((frame-1)/max(1,count-1))
        for pb in rig.pose.bones:
            pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=pb.name)
            pb.keyframe_insert(data_path='location',frame=frame,group=pb.name)
    a.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,a);track.mute=True
    return a

actions={name:action(name,count,fn) for name,count,fn in [
    ('Tpose',2,lambda t:None),('Idle',49,idle),('Walk',33,walk),('Wave',73,wave),('Eat_Reach_Test',73,eat)]}
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=73

def aim(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.5,-6,1.55))
camera=bpy.context.object;camera.name='Preview_Camera';aim(camera,(0,0,-.02))
camera.data.type='ORTHO';camera.data.ortho_scale=2.6;scene.camera=camera
world=bpy.data.worlds.new('Preview_World');world.color=(.24,.26,.28);scene.world=world
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO';scene.display.shading.studio_light='paint.sl'
scene.display.shading.color_type='MATERIAL';scene.display.shading.background_type='WORLD'
scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=False
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.render.image_settings.file_format='PNG'
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.953))
floor=bpy.context.object;floor.name='Preview_Floor'
floor_mat=bpy.data.materials.new('Floor');floor_mat.diffuse_color=(.23,.26,.29,1);floor.data.materials.append(floor_mat)

# Optional separate food prop follows the hand; not part of base geometry/export.
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.085,location=(-.785,-.01,-.105))
food=bpy.context.object;food.name='Food_Demo_Only'
fm=bpy.data.materials.new('Food');fm.diffuse_color=(.85,.42,.08,1);food.data.materials.append(fm)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
g=food.vertex_groups.new(name='Arm.R');g.add(list(range(len(food.data.vertices))),1,'REPLACE')
m=food.modifiers.new('Follow right hand','ARMATURE');m.object=rig;food.parent=rig
for f in food.data.polygons:f.use_smooth=True
food.hide_render=True;food.hide_set(True)

for label,name,frame in [('tpose','Tpose',1),('idle','Idle',1),('walk','Walk',9),('wave','Wave',37),('eat','Eat_Reach_Test',37)]:
    rig.animation_data.action=actions[name];scene.frame_set(frame)
    food.hide_render=name!='Eat_Reach_Test';food.hide_set(name!='Eat_Reach_Test')
    scene.render.filepath=str(P/(label+'.png'));bpy.ops.render.render(write_still=True)

food.hide_render=True;food.hide_set(True)
rig.animation_data.action=actions['Tpose'];scene.frame_set(1)
for o in bpy.context.selected_objects:o.select_set(False)
rig.select_set(True);bpy.context.view_layer.objects.active=rig
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active;space.overlay.show_floor=False
            space.region_3d.view_distance=3.5;space.region_3d.view_location=(0,0,0)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-tpose-rig.blend'))
mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-tpose-rig.glb'),use_selection=True,export_format='GLB',
    export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_materials='EXPORT',
    export_cameras=False,export_lights=False)

assert original==[tuple(v.co) for v in mesh.data.vertices]
assert original_faces==[tuple(f.vertices) for f in mesh.data.polygons]
assert all(abs(sum(g.weight for g in v.groups)-1)<1e-5 for v in mesh.data.vertices)
report={'source':'Meshy_AI_Blank_Buddy_1018043201_generate.glb',
    'vertices':len(original),'triangles':len(original_faces),'mesh_coordinates_unchanged':True,
    'mesh_faces_unchanged':True,'weights_normalized':True,'bones':list(spec),'actions':list(actions),
    'notes':'No elbows/knees. Single bones per limb with shoulder/hip root blending. Eat is a reach prototype; mouth texture not yet placed.'}
(P/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('RIG_SAVED',json.dumps(report))
