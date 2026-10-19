import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-heat-v15/buddy-walk-heat.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];s=bpy.context.scene
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Greeting_Wave')
for v in mesh.data.vertices:
    x,y,z=v.co
    t=max(0,min(1,(abs(x)-.30)/.15));factor=t*t*(3-2*t)
    if z>-.015:factor=0
    removed=0
    for g in list(v.groups):
        name=mesh.vertex_groups[g.group].name
        if name in ['Arm.L','Arm.R']:
            removed+=g.weight*(1-factor)
            mesh.vertex_groups[name].add([v.index],g.weight*factor,'REPLACE')
    if removed:mesh.vertex_groups['Head' if z>-.015 else 'Body'].add([v.index],removed,'ADD')
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def rot(name,q):
    pb=rig.pose.bones[name];b=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=b.inverted()@q@b
for f in range(1,97):
    t=(f-1)/96;lift=ease(t/.22)*(1-ease((t-.76)/.24))
    wave=math.sin(max(0,t-.22)*math.tau*4)*lift
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    rot('Arm.L',Quaternion((0,1,0),math.radians((-63+6*wave)*lift)))
    rot('Head',Quaternion((0,1,0),math.radians(-3*lift)))
    rot('Body',Quaternion((0,1,0),math.radians(-1.5*lift)))
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
from mathutils import Matrix
arm=next(m for m in mesh.modifiers if m.type=='ARMATURE');arm.use_deform_preserve_volume=False
s.frame_set(40);bpy.context.view_layer.update()
coords=[v.co.copy() for v in mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
neighbors=[set() for v in coords]
for e in mesh.data.edges:
    a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
mask=[]
for v in mesh.data.vertices:
    x,y,z=v.co
    mask.append(math.sin(math.pi*(x-.26)/.34)**2*math.sin(math.pi*(z+.51)/.52)**2 if .26<x<.60 and -.51<z<.01 else 0)
for iteration in range(260):
    new=[v.copy() for v in coords]
    for i,w in enumerate(mask):
        if w>.001 and neighbors[i]:new[i]=coords[i].lerp(sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i]),.5*w)
    coords=new
mesh.shape_key_add(name='Basis');key=mesh.shape_key_add(name='Greeting_Shoulder')
mats={pb.name:pb.matrix@pb.bone.matrix_local.inverted() for pb in rig.pose.bones}
for i,v in enumerate(mesh.data.vertices):
    if mask[i]<.001:continue
    m=Matrix(((0,0,0,0),)*4);total=0
    for g in v.groups:
        n=mesh.vertex_groups[g.group].name
        if n in mats:m+=mats[n]*g.weight;total+=g.weight
    if total:
        m*=1/total;key.data[i].co=m.inverted_safe()@coords[i]
for f in range(1,97):
    t=(f-1)/96;key.value=ease(t/.22)*(1-ease((t-.76)/.24));key.keyframe_insert(data_path='value',frame=f)
s.frame_start=1;s.frame_end=96;s.render.fps=24;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-greeting.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos in [('front',(0,-7,-.02)),('angle',(3,-7,1.15))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
