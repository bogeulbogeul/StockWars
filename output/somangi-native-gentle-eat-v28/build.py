import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease,bake_shapes,points
from merge_clip import merge_clip
from joint_relax import JointRelax
S=P.parent/'somangi-eat-attention-v25'
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];old=bpy.data.objects['Somangi_OriginalRig'];old.animation_data_clear()
for bone in old.pose.bones:bone.matrix_basis.identity()
bpy.context.view_layer.update();parts={}
for s in ['L','R']:
    group=body.vertex_groups['Part.Arm.'+s].index
    parts[s]=[v.index for v in body.data.vertices if any(g.group==group for g in v.groups)]
base=np.array([v.co[:] for v in body.data.vertices]);body.modifiers.clear();body.parent=None
for ob in list(bpy.data.objects):
    if ob!=body:bpy.data.objects.remove(ob,do_unlink=True)
with bpy.data.libraries.load(str(S/'somangi-eat.blend')) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith(('bread_Prop','Food_Equal','Bread roll','Bread score'))]
for ob in dst.objects:
    if ob:bpy.context.scene.collection.objects.link(ob)
food=bpy.data.objects['bread_Prop'];loaf=bpy.data.objects['Bread roll'];scene=bpy.context.scene
scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
foodtrace=[];centers=[]
for f in range(1,92):
    scene.frame_set(f);foodtrace.append(food.matrix_world.copy());centers.append(sum((loaf.matrix_world@v.co for v in loaf.data.vertices),Vector())/len(loaf.data.vertices))
orientation=foodtrace[33].to_quaternion()
data=bpy.data.armatures.new('Native gentle shoulder rig');rig=bpy.data.objects.new('Somangi_NativeRig',data);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
root=data.edit_bones.new('Body');root.head=(0,0,0);root.tail=(0,0,.1);anchors={};palms={}
for s,sign in [('L',1),('R',-1)]:
    anchor=Vector((sign*.36,0,-.20));anchors[s]=anchor
    ids=np.array(parts[s]);distance=np.linalg.norm(base[ids]-np.array(anchor),axis=1);patch=ids[distance>np.quantile(distance,.93)]
    palms[s]=Vector(base[patch].mean(0));bone=data.edit_bones.new('Arm.'+s);bone.head=anchor;bone.tail=anchor+Vector((0,0,-.2));bone.parent=root
bpy.ops.object.mode_set(mode='OBJECT');body.vertex_groups.clear()
groups={n:body.vertex_groups.new(name=n) for n in ['Body','Arm.L','Arm.R']}
def shoulder(z):
    if z<-.24:return .255+.60*min(.10,-z-.24)+.35*max(0,-z-.34)
    knots=[(-.24,.255),(-.16,.222),(-.08,.225),(0,.245),(.02,.25)]
    return float(np.interp(z,[a for a,_ in knots],[b for _,b in knots]))
weights=[];limbset=set(parts['L']+parts['R'])
for i,(x,y,z) in enumerate(base):
    side='L' if x>0 else 'R';w=float(ease((abs(x)-shoulder(z)-.065)/.055)*ease((-.005-z)/.075))
    if i not in limbset:w=0.
    weights.append(w)
    if w>0:groups['Arm.'+side].add([i],w,'REPLACE')
    if w<1:groups['Body'].add([i],1-w,'REPLACE')
modifier=body.modifiers.new('Native shoulder volume preservation','ARMATURE');modifier.object=rig;modifier.use_deform_preserve_volume=True
body.parent=rig;body.matrix_parent_inverse=rig.matrix_world.inverted();cache=[]
relax=JointRelax(body,base,weights,ease)
for f in range(1,92):
    scene.frame_set(f);t=(f-1)/30;returning=float(ease((t-1.9)/.8));hands=[]
    pulse=max(math.exp(-((t-a)/.14)**2) for a in [1.09,1.49,1.79])
    for s,sign in [('L',1),('R',-1)]:
        anchor=anchors[s];v=palms[s]-anchor;dx=sign*.25-anchor.x;dz=-.15+.012*pulse
        dy=-math.sqrt(max(.005,v.length_squared-dx*dx-dz*dz))
        q=v.rotation_difference(Vector((dx,dy,dz))).slerp(Quaternion((1,0,0,0)),returning)
        transform=Matrix.Translation(anchor+Vector((0,-.08*(1-returning),0)))@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
        bone=rig.pose.bones['Arm.'+s];bone.rotation_mode='QUATERNION';bone.matrix=transform@bone.bone.matrix_local
        hands.append(transform@palms[s])
    bpy.context.view_layer.update();cache.append(relax.solve(points(body),1-returning))
    desired=(hands[0]+hands[1])/2+Vector((0,-.025,.04));trace=foodtrace[f-1]
    matrix=Matrix.LocRotScale(trace.translation,orientation,trace.to_scale());local=trace.inverted()@centers[f-1]
    food.matrix_world=Matrix.Translation(desired-matrix@local)@matrix
    food.keyframe_insert('location',frame=f);food.keyframe_insert('rotation_quaternion',frame=f)
body.modifiers.clear();body.parent=None;bpy.data.objects.remove(rig,do_unlink=True)
body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
bake_shapes(body,cache,'Gentle native surface')
sys.path.append(str(P.parent/'somangi-eat-original-smile-v11'));from mouth import replace_mouth
mouth,arrays,patch,patch_arrays=replace_mouth(body,base,[base]*91)
# Keep the open mouth smaller than the eyes and exactly on the unchanged facial surface.
from mathutils.bvhtree import BVHTree
headtree=BVHTree.FromPolygons([Vector(v) for v in base],[list(p.vertices) for p in body.data.polygons])
for array in arrays:
    if array[:,1].min()>-.3:continue
    center=array.mean(0);array[:,0]=center[0]+(array[:,0]-center[0])*.75;array[:,2]=center[2]+(array[:,2]-center[2])*.65
    for j,(x,y,z) in enumerate(array):
        hit,normal,_,_=headtree.ray_cast(Vector((x,-1,z)),Vector((0,1,0)),2)
        if hit is not None:array[j]=hit+normal*.006
bake_shapes(mouth,arrays,'Small chew mouth');bake_shapes(patch,patch_arrays,'Original smile cover')
scene.frame_set(91);bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Gentle_Eat_Original_Rest')
(P/'metadata.json').write_text(json.dumps(dict(parts=parts,weights=weights,originalVertices=len(base),source='somangi-black-eyes-v1',restError=float(np.max(np.abs(cache[-1]-base))),nativeTopology=True,gameInstalled=False)))
print('NATIVE REST ERROR',float(np.max(np.abs(cache[-1]-base))))
