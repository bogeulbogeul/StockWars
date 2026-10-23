import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease
from merge_clip import merge_clip
S=P.parent/'somangi-soft-connections-v36'
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;rig=bpy.data.objects['Somangi_WholeArmRig'];food=bpy.data.objects['bread_Prop'];loaf=bpy.data.objects['Bread roll']
body=bpy.data.objects['Somangi_SmoothBody'];native_head=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds'])
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text());connections=json.loads((S/'connections.json').read_text())
for name,key in [('Arm.L','1'),('Arm.R','2')]:
    group=body.vertex_groups[name];ids=set(connections[name]['ids'])|{v.index for v in body.data.vertices if any(g.group==group.index and g.weight>1e-6 for g in v.groups)}
    anchor=Vector(meta['centers'][key]);axis=(Vector(meta['palms'][key])-anchor).normalized()
    for i in ids:
        weight=float(ease(((body.data.vertices[i].co-anchor).dot(axis)-.01)/.17))
        for group_name in ['Body','Head',name]:body.vertex_groups[group_name].remove([i])
        if weight>1e-6:group.add([i],weight,'REPLACE')
        if weight<1-1e-6:body.vertex_groups['Body'].add([i],1-weight,'REPLACE')
bg=body.vertex_groups['Body'];hg=body.vertex_groups['Head'];neck_changed=[]
for vertex in body.data.vertices:
    if vertex.index in native_head:continue
    portion=sum(g.weight for g in vertex.groups if g.group in [bg.index,hg.index])
    if portion<1e-6:continue
    x,y,z=vertex.co;radius=max(abs(x)/.41,abs(y)/.28)
    weight=float(ease((z+.24)/.215)*(1-ease((radius-.9)/.35)))*portion
    bg.remove([vertex.index]);hg.remove([vertex.index])
    if portion-weight>1e-6:bg.add([vertex.index],portion-weight,'REPLACE')
    if weight>1e-6:hg.add([vertex.index],weight,'REPLACE');neck_changed.append(vertex.index)
optimized=json.loads((P/'optimized-arm-weights.json').read_text())
for name,entries in optimized.items():
    for i,weight in entries:
        for group_name in ['Body','Head',name]:body.vertex_groups[group_name].remove([i])
        if weight>1e-6:body.vertex_groups[name].add([i],weight,'REPLACE')
        if weight<1-1e-6:hg.add([i],1-weight,'REPLACE')
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text());traces=[];centers=[];offsets=[]
for f in range(1,137):
    sf=1+(f-1)/1.5;scene.frame_set(int(sf),subframe=sf-int(sf));traces.append(food.matrix_world.copy());vertices=[loaf.matrix_world@v.co for v in loaf.data.vertices];centers.append(sum(vertices,Vector())/len(vertices));offsets.append([v-centers[-1] for v in vertices])
# Slow the existing mouth and equal-size consumption keys together.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.co.x=1+(key.co.x-1)*1.5;key.handle_left.x=1+(key.handle_left.x-1)*1.5;key.handle_right.x=1+(key.handle_right.x-1)*1.5
rig.animation_data_clear();food.animation_data_clear();food.rotation_mode='QUATERNION';identity=Quaternion((1,0,0,0))
for bone in rig.pose.bones:bone.matrix_basis.identity()
poses=[]
for f in range(1,137):
    scene.frame_set(f);t=(f-1)/30;returning=float(ease((t-3.3)/.975))
    bite=max(math.exp(-((t-center)/.18)**2) for center in [1.635,2.235,2.685]);hands=[]
    for s,key,sign in [('L','1',1),('R','2',-1)]:
        anchor=Vector(meta['centers'][key]);palm=Vector(meta['palms'][key]);native=palm-anchor
        dx=sign*.25-anchor.x;dz=-.36+.16*bite;dy=-math.sqrt(max(.001,native.length_squared-dx*dx-dz*dz))
        q=native.rotation_difference(Vector((dx,dy,dz))).slerp(identity,returning)
        transform=Matrix.Translation(anchor+Vector((0,-.06*bite,-.05*bite)))@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
        pb=rig.pose.bones['Arm.'+s];pb.rotation_mode='QUATERNION';pb.matrix=transform@pb.bone.matrix_local
        pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f);hands.append(transform@palm)
    angle=math.radians(12)*bite;q=Quaternion((1,0,0),angle);pivot=Vector((0,0,.02));down=.22*math.sin(angle)
    transform=Matrix.Translation(pivot+Vector((0,0,-down)))@q.to_matrix().to_4x4()@Matrix.Translation(-pivot)
    pb=rig.pose.bones['Head'];pb.rotation_mode='QUATERNION';pb.matrix=transform@pb.bone.matrix_local
    pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f)
    trace=traces[f-1];local=trace.inverted()@centers[f-1];tilt=Matrix.Rotation(math.radians(-20)*bite,4,'X');bottom=min((tilt.to_3x3()@v).z for v in offsets[f-1])
    desired=(hands[0]+hands[1])/2+Vector((0,-.14+.06*bite,.035+.05*bite-bottom));matrix=tilt@trace
    food.matrix_world=Matrix.Translation(desired-matrix@local)@matrix
    for name in ['location','rotation_quaternion','scale']:food.keyframe_insert(name,frame=f)
    poses.append(dict(frame=f,bite=bite,headDegrees=math.degrees(angle),hands=[list(p) for p in hands]))
for ob in [rig,food]:
    for layer in ob.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
scene.frame_start=1;scene.frame_end=136;scene.render.fps=30;scene.frame_set(136)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','RaiseBread_Bite_LowerChew');(P/'poses.json').write_text(json.dumps(poses))
