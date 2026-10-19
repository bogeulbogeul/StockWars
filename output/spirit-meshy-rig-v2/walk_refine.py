import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion
P=Path(__file__).resolve().parent.parent/'spirit-walk-soft-v3'
P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'spirit-meshy-rig-v2/buddy-tpose-rig.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original_Mesh'];scene=bpy.context.scene
rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(1)
deps=bpy.context.evaluated_depsgraph_get()
coords=[v.co.copy() for v in mesh.evaluated_get(deps).data.vertices]
# Bake the relaxed stance, then soften only the shoulder transition.
arm_ids={mesh.vertex_groups[n].index for n in ['Arm.L','Arm.R']}
mask=[]
for v in mesh.data.vertices:
    w=sum(g.weight for g in v.groups if g.group in arm_ids)
    x,y,z=v.co
    spatial=0
    if .25<abs(x)<.55 and -.29<z<.045:
        spatial=math.sin(math.pi*(abs(x)-.25)/.30)*math.sin(math.pi*(z+.29)/.335)
    mask.append(max(spatial,math.sin(math.pi*w)**.7 if .001<w<.999 else 0))
neighbors=[set() for v in coords]
for e in mesh.data.edges:
    a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
for iteration in range(240):
    new=[v.copy() for v in coords]
    for i,w in enumerate(mask):
        if w and neighbors[i]:
            avg=sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i])
            new[i]=coords[i].lerp(avg,.48*w)
    coords=new
for v,co in zip(mesh.data.vertices,coords):v.co=co
body=mesh.vertex_groups['Body']
leg_ids={mesh.vertex_groups[n].index for n in ['Leg.L','Leg.R']}
for v in mesh.data.vertices:
    if abs(v.co.x)<.13:
        factor=min(1,abs(v.co.x)/.13);factor=factor*factor*(3-2*factor)
        removed=0
        for g in list(v.groups):
            if g.group in leg_ids:
                removed+=g.weight*(1-factor)
                mesh.vertex_groups[g.group].add([v.index],g.weight*factor,'REPLACE')
        if removed:body.add([v.index],removed,'ADD')
for o in bpy.context.selected_objects:o.select_set(False)
rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
for pb in rig.pose.bones:
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
def rotate(name,axis,deg):
    pb=rig.pose.bones[name];q=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
rig.animation_data_create();action=bpy.data.actions.new('Walk_Soft');rig.animation_data.action=action
scene.render.fps=24;scene.frame_start=1;scene.frame_end=32
foot_ids=[v.index for v in mesh.data.vertices if v.co.z<-.78]
for frame in range(1,34):
    phase=(frame-1)/32*math.tau;s=math.sin(phase)
    rotate('Leg.L',(1,0,0),8*s);rotate('Leg.R',(1,0,0),-8*s)
    rotate('Arm.L',(1,0,0),-5*s);rotate('Arm.R',(1,0,0),5*s)
    rotate('Body',(0,1,0),.7*s)
    rotate('Head',(0,1,0),-.7*s)
    rig.pose.bones['Root'].location=(0,0,0)
    bpy.context.view_layer.update()
    evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    low=min(evaluated.data.vertices[i].co.z for i in foot_ids)
    rig.pose.bones['Root'].location.z=-.9524-low
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=frame,group=pb.name)
scene.frame_set(1)
scene.render.resolution_x=600;scene.render.resolution_y=600
camera=scene.camera;camera.location=(2,-7,1.15)
camera.rotation_euler=(Vector((0,0,-.02))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=2.35
for name in ['Food_Demo_Only']:
    o=bpy.data.objects.get(name)
    if o:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-soft-walk.blend'))
mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-soft-walk.glb'),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='ACTIONS')
folder=P/'frames';folder.mkdir(exist_ok=True)
for frame in range(1,33,2):
    scene.frame_set(frame);scene.render.filepath=str(folder/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
(P/'notes.json').write_text(json.dumps({'shoulder':'relaxed rest pose baked, shoulder blend region smoothed','leg_swing_degrees':8,'arm_swing_degrees':5,'fps':24,'loop_frames':32,'original_preserved':True},indent=2))
