import bpy,math,json
from pathlib import Path
from mathutils import Quaternion,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-connections-v11/buddy-soft-connections.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];s=bpy.context.scene
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Sit_Down')
original=[tuple(v.co) for v in mesh.data.vertices]
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
# Feet must follow their leg completely, including the inner edges.
for v in mesh.data.vertices:
    x,y,z=v.co
    if z<-.52:
        side='L' if x>=0 else 'R'
        w=smooth(-.52,-.69,z)
        for group in mesh.vertex_groups:group.remove([v.index])
        mesh.vertex_groups['Leg.'+side].add([v.index],w,'REPLACE')
        mesh.vertex_groups['Body'].add([v.index],1-w,'REPLACE')
def rot(n,deg,axis=(1,0,0)):
    pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
for f in range(1,73):
    t=min(1,max(0,(f-9)/38));a=t*t*(3-2*t)
    for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    rot('Leg.L',-65*a);rot('Leg.R',-65*a)
    rot('Body',-4*a);rot('Head',4*a)
    rot('Arm.L',-9*a);rot('Arm.R',-9*a)
    rig.pose.bones['Root'].location.z=-.285*a
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
s.frame_start=1;s.frame_end=72;s.render.fps=24;s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-sit.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-sit.glb'),use_selection=True,export_format='GLB',export_animation_mode='ACTIONS')
s.render.resolution_x=540;s.render.resolution_y=540
for name,pos in [('angle',(3,-7,1.25)),('side',(7,0,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.12))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,73,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
assert original==[tuple(v.co) for v in mesh.data.vertices]
(P/'validation.json').write_text(json.dumps({'source':'buddy-walk-connections-v11','mesh_unchanged':True,'arms_not_separated':True,'action':'Sit_Down'},indent=2))
