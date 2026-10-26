import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease,bake_shapes
from merge_clip import merge_clip
from caps import closed_parts
S=P.parent/'somangi-eat-attention-v25'
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];old=bpy.data.objects['Somangi_OriginalRig'];old.animation_data_clear()
for bone in old.pose.bones:bone.matrix_basis.identity()
bpy.context.view_layer.update();parts={}
for s in ['L','R']:
    group=body.vertex_groups['Part.Arm.'+s].index
    parts[s]=[v.index for v in body.data.vertices if any(g.group==group for g in v.groups)]
original=np.array([v.co[:] for v in body.data.vertices]);body.modifiers.clear();body.parent=None
for ob in list(bpy.data.objects):
    if ob!=body:bpy.data.objects.remove(ob,do_unlink=True)
initial,parts=closed_parts(body,parts);base=np.array([v.co[:] for v in body.data.vertices])
assert np.max(np.abs(base[:initial]-original))==0
with bpy.data.libraries.load(str(S/'somangi-eat.blend')) as (src,dst):
    dst.objects=[name for name in src.objects if name.startswith(('bread_Prop','Food_Equal','Bread roll','Bread score'))]
for ob in dst.objects:
    if ob and ob.name not in bpy.context.scene.collection.objects:bpy.context.scene.collection.objects.link(ob)
food=bpy.data.objects['bread_Prop'];loaf=bpy.data.objects['Bread roll'];scene=bpy.context.scene
scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
foodtrace=[];sizes=[];foodcenters=[]
for f in range(1,92):
    scene.frame_set(f);foodtrace.append(food.matrix_world.copy())
    v=[loaf.matrix_world@p.co for p in loaf.data.vertices];a=np.array(v)
    sizes.append(float((a[:,0].max()-a[:,0].min())/2));foodcenters.append(Vector(a.mean(0)))
food_orientation=foodtrace[33].to_quaternion()
data=bpy.data.armatures.new('Original silhouette rigid skeleton');rig=bpy.data.objects.new('Somangi_RigidArms',data);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
root=data.edit_bones.new('Body');root.head=(0,0,0);root.tail=(0,0,.1)
anchors={};palms={}
for s,sign in [('L',1),('R',-1)]:
    anchor=Vector((sign*.285,0,-.11));anchors[s]=anchor
    ids=np.array(parts[s]);dist=np.linalg.norm(base[ids]-np.array(anchor),axis=1);patch=ids[dist>np.quantile(dist,.93)]
    palms[s]=Vector(base[patch].mean(0))
    bone=data.edit_bones.new('Arm.'+s);bone.head=anchor;bone.tail=anchor+Vector((0,0,-.2));bone.parent=root
bpy.ops.object.mode_set(mode='OBJECT');body.vertex_groups.clear();armset=set(parts['L']+parts['R'])
body.vertex_groups.new(name='Body').add([i for i in range(len(base)) if i not in armset],1,'REPLACE')
for s in parts:body.vertex_groups.new(name='Arm.'+s).add(parts[s],1,'REPLACE')
modifier=body.modifiers.new('Rigid original arms','ARMATURE');modifier.object=rig;body.parent=rig;body.matrix_parent_inverse=rig.matrix_world.inverted()
for f in range(1,92):
    scene.frame_set(f);t=(f-1)/30;returning=float(ease((t-1.9)/.8));hands=[]
    for s,sign in [('L',1),('R',-1)]:
        anchor=anchors[s];v=palms[s]-anchor;targetx=sign*.17
        pulse=max(math.exp(-((t-a)/.14)**2) for a in [1.09,1.49,1.79])
        dx=targetx-anchor.x;dz=-.28+.012*pulse
        dy=-math.sqrt(max(.005,v.length_squared-dx*dx-dz*dz))
        q=v.rotation_difference(Vector((dx,dy,dz)));q=q.slerp(Quaternion((1,0,0,0)),returning)
        forward=Vector((0,-.045*(1-returning),0))
        transform=Matrix.Translation(anchor+forward)@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
        bone=rig.pose.bones['Arm.'+s];bone.rotation_mode='QUATERNION';bone.matrix=transform@bone.bone.matrix_local
        bone.keyframe_insert('location',frame=f);bone.keyframe_insert('rotation_quaternion',frame=f);hands.append(transform@palms[s])
    desired=(hands[0]+hands[1])/2+Vector((0,-.025,.04))
    trace=foodtrace[f-1];local_center=trace.inverted()@foodcenters[f-1]
    matrix=Matrix.LocRotScale(trace.translation,food_orientation,trace.to_scale())
    food.matrix_world=Matrix.Translation(desired-matrix@local_center)@matrix
    food.keyframe_insert('location',frame=f);food.keyframe_insert('rotation_quaternion',frame=f)
for layer in rig.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:key.interpolation='LINEAR'
sys.path.append(str(P.parent/'somangi-eat-original-smile-v11'))
from mouth import replace_mouth
mouth,arrays,patch,patch_arrays=replace_mouth(body,base,[base]*91)
bake_shapes(mouth,arrays,'OriginalFaceMouth');bake_shapes(patch,patch_arrays,'OriginalFaceCover')
# Joint closures use plain original skin color, without degenerate UV-dependent metal/roughness.
cap_material=patch.data.materials[0].copy();cap_material.name='Concealed joint original matte skin'
bs=next(n for n in cap_material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
for name,value in [('Metallic',0),('Roughness',1),('Specular IOR Level',0)]:
    for link in list(bs.inputs[name].links):cap_material.node_tree.links.remove(link)
    bs.inputs[name].default_value=value
body.data.materials.append(cap_material)
for poly in list(body.data.polygons)[83332:]:poly.material_index=len(body.data.materials)-1
import bmesh
bm=bmesh.new();bm.from_mesh(body.data);layer=bm.verts.layers.deform.active
body_group=body.vertex_groups['Body'].index
for sign in [1,-1]:
    socket=bmesh.ops.create_uvsphere(bm,u_segments=40,v_segments=24,radius=1)['verts']
    for v in socket:
        x,y,z=v.co;v.co=(sign*.24+.09*x,.13*y,-.30+.115*z);v[layer][body_group]=1
    selected=set(socket)
    for face in bm.faces:
        if all(v in selected for v in face.verts):face.material_index=len(body.data.materials)-1;face.smooth=True
for name in ['Body','Arm.L','Arm.R']:
    group=body.vertex_groups[name].index;vertices=[v for v in bm.verts if v[layer].get(group,0)>.999]
    bmesh.ops.remove_doubles(bm,verts=vertices,dist=1e-6)
bm.normal_update();bm.to_mesh(body.data);bm.free();body.data.update()
body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
scene.frame_set(91);bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','OriginalShape_Eat_Attention')
(P/'preservation.json').write_text(json.dumps(dict(originalOuterVertexCount=initial,originalOuterPositionError=0,parts=parts,source='somangi-black-eyes-v1',gameInstalled=False)))
print('ORIGINAL SURFACE PRESERVED',initial)
