import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body']
rig.animation_data_clear()
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
for pb in rig.pose.bones:
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
bone=rig.data.edit_bones.new('Food');bone.head=(0,0,0);bone.tail=(0,0,.12);bone.parent=rig.data.edit_bones['Root']
bpy.ops.object.mode_set(mode='OBJECT')
anchors={}
for side in ['L','R']:
    group=mesh.vertex_groups['Arm.'+side].index
    ids=[v for v in mesh.data.vertices if abs(v.co.x)>.49 and v.co.z<-.30 and any(g.group==group and g.weight>.85 for g in v.groups)]
    assert ids
    anchors[side]=sum((v.co for v in ids),Vector())/len(ids)
# Separate, simple rounded bread prop. Native 3D geometry, no painted image.
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16)
food=bpy.context.object;food.name='Food_Bun';food.scale=(.23,.13,.16)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
mat=bpy.data.materials.new('Soft golden bun');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.64,.30,.085,1)
bs.inputs['Roughness'].default_value=.9;bs.inputs['Specular IOR Level'].default_value=.1
food.data.materials.append(mat)
for f in food.data.polygons:f.use_smooth=True
vg=food.vertex_groups.new(name='Food');vg.add(list(range(len(food.data.vertices))),1,'REPLACE')
modifier=food.modifiers.new('Follow baked food socket','ARMATURE');modifier.object=rig;food.parent=rig
def smooth(a,b,t):
    u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
def world_rotation(name,q):
    pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=basis.inverted()@q@basis
def pose(t):
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
    lift=smooth(.10,.37,t)*(1-smooth(.78,1,t))
    hands={}
    for side,sign in [('L',1),('R',-1)]:
        name='Arm.'+side;bone=rig.data.bones[name]
        native=anchors[side]-bone.head_local
        target=Vector((sign*.29,-.29,-.36+.22*lift))-bone.head_local
        q=native.rotation_difference(target.normalized()*native.length)
        world_rotation(name,q)
        hands[side]=bone.head_local+q@native
    nod=0
    for center in [.46,.64]:
        d=abs(t-center)/.075
        if d<1:nod+=math.sin((1-d)*math.pi/2)**2
    world_rotation('Head',Quaternion((1,0,0),math.radians(22*lift+6*nod)))
    center=(hands['L']+hands['R'])/2+Vector((0,-.12,.11))
    rig.pose.bones['Food'].location=rig.data.bones['Food'].matrix_local.to_3x3().inverted()@center
    return {'lift':lift,'food':list(center),'hands':{k:list(v) for k,v in hands.items()},'head_nod_degrees':22*lift+6*nod}
rig.animation_data_create();action=bpy.data.actions.new('Eat');rig.animation_data.action=action
rows=[]
for frame in range(1,74):
    row=pose((frame-1)/72);row['frame']=frame;rows.append(row)
    for pb in rig.pose.bones:
        pb.keyframe_insert('location',frame=frame,group=pb.name)
        pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
action.use_fake_user=True;s.render.fps=24;s.frame_start=1;s.frame_end=73;s.frame_set(34)
import sys
sys.path.insert(0,str(P))
from structure import rebuild
parts=rebuild(mesh,rig)
cam=s.camera;target=Vector((0,-.1,0))
def render(name,pos):
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=12
render('eat-front',(0,-6,0));render('eat-side',(6,-.1,0));render('eat-angle',(2.5,-6,1))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);food.select_set(True)
for part in parts:part.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),use_selection=True,export_format='GLB',export_skins=True,
 export_animations=True,export_animation_mode='ACTIONS',export_materials='EXPORT',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps(rows,indent=2))
print('EAT_BUILD_COMPLETE',json.dumps({k:list(v) for k,v in anchors.items()}))
