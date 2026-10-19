import bpy,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-hop-corrective-v24/buddy-hop-corrected.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
mesh=bpy.data.objects['Buddy_Original']
blend=mesh.vertex_groups.new(name='Seat_Clearance_Hip_Polish')
for v in mesh.data.vertices:
    if -.83<v.co.z<-.55:
        blend.add([v.index],math.sin(math.pi*(v.co.z+.83)/.28)**2,'REPLACE')
mod=mesh.modifiers.new('Polish raised hip transition','SMOOTH')
mod.vertex_group=blend.name;mod.factor=.7;mod.iterations=35
# Cache existing poses before adding keys, so new interpolation cannot accumulate.
poses={}
for f in range(1,97):
    s.frame_set(f);poses[f]={n:rig.pose.bones[n].location.copy() for n in ['Leg.L','Leg.R']}
for f in range(1,97):
    s.frame_set(f)
    t=max(0,min(1,(f-26)/22));a=t*t*(3-2*t)
    for n in ['Leg.L','Leg.R']:
        pb=rig.pose.bones[n]
        pb.location=poses[f][n]+pb.bone.matrix_local.to_quaternion().inverted()@Vector((0,0,.115*a))
        pb.keyframe_insert(data_path='location',frame=f,group=n)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-seat-clearance.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos,target in [('front',(0,-7,.05),(0,0,.05)),('side',(7,-.2,.05),(0,-.2,-.15))]:
    cam=s.camera;cam.location=pos;cam.data.ortho_scale=2.75
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
