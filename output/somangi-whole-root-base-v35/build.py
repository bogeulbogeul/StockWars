import bpy,bmesh,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease,points
from merge_clip import merge_clip
from cut_forearms import cut
from socket_grid import fill_socket
from armpit_surface import smooth_connection
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];original=np.array([v.co[:] for v in body.data.vertices]);parts={}
original_tree=BVHTree.FromPolygons([Vector(p) for p in original],[list(p.vertices) for p in body.data.polygons])
socket_uv={}
for part,sign in [(1,1),(2,-1)]:
    target=Vector((sign*.27,-.08,-.04));face=min(body.data.polygons,key=lambda p:(p.center-target).length)
    socket_uv[part]=sum((body.data.uv_layers.active.data[i].uv for i in face.loop_indices),Vector((0,0)))/len(face.loop_indices)
for s,part in [('L',1),('R',2)]:
    group=body.vertex_groups['Part.Arm.'+s].index;parts[part]=[v.index for v in body.data.vertices if any(g.group==group for g in v.groups)]
arm_source=set(parts[1]+parts[2]);torso_original=original[[i for i in range(len(original)) if i not in arm_source]]
body.modifiers.clear();body.parent=None
for ob in list(bpy.data.objects):
    if ob!=body:bpy.data.objects.remove(ob,do_unlink=True)
centers,groups=cut(body,parts);base=np.array([v.co[:] for v in body.data.vertices]);palms={}
for part in [1,2]:
    ids=np.array(groups[part]);distance=np.linalg.norm(base[ids]-np.array(centers[part]),axis=1);palms[part]=Vector(base[ids[distance>np.quantile(distance,.93)]].mean(0))
with bpy.data.libraries.load(str(P.parent/'somangi-gentle-final-v29/somangi-eat.blend')) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith(('bread_Prop','Food_Equal','Bread roll','Bread score','Somangi_AnimatedMouth','Somangi_TemporarySmileCover'))]
for ob in dst.objects:
    if ob:bpy.context.scene.collection.objects.link(ob)
scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
food=bpy.data.objects['bread_Prop'];loaf=bpy.data.objects['Bread roll'];foodtrace=[];foodcenters=[]
for f in range(1,92):
    scene.frame_set(f);foodtrace.append(food.matrix_world.copy());foodcenters.append(sum((loaf.matrix_world@v.co for v in loaf.data.vertices),Vector())/len(loaf.data.vertices))
orientation=foodtrace[33].to_quaternion()
data=bpy.data.armatures.new('Whole arms shoulder rotation only');rig=bpy.data.objects.new('Somangi_WholeArmRig',data);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
root=data.edit_bones.new('Body');root.head=(0,0,0);root.tail=(0,0,.1)
for part,s in [(1,'L'),(2,'R')]:
    bone=data.edit_bones.new('Arm.'+s);bone.head=centers[part];bone.tail=palms[part];bone.parent=root
bpy.ops.object.mode_set(mode='OBJECT');modifier=body.modifiers.new('Whole arms rigid shoulder rotation','ARMATURE');modifier.object=rig;body.parent=rig;body.matrix_parent_inverse=rig.matrix_world.inverted()
for f in range(1,92):
    scene.frame_set(f);t=(f-1)/30;returning=float(ease((t-1.9)/.8));pulse=max(math.exp(-((t-a)/.14)**2) for a in [1.09,1.49,1.79]);hands=[]
    for part,s,sign in [(1,'L',1),(2,'R',-1)]:
        anchor=centers[part];v=palms[part]-anchor;dx=sign*.43-anchor.x;dz=-.43+.004*pulse;dy=-math.sqrt(max(.002,v.length_squared-dx*dx-dz*dz))
        q=v.rotation_difference(Vector((dx,dy,dz))).slerp(Quaternion((1,0,0,0)),returning)
        transform=Matrix.Translation(anchor)@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
        bone=rig.pose.bones['Arm.'+s];bone.rotation_mode='QUATERNION';bone.matrix=transform@bone.bone.matrix_local
        bone.keyframe_insert('location',frame=f);bone.keyframe_insert('rotation_quaternion',frame=f);hands.append(transform@palms[part])
    trace=foodtrace[f-1];matrix=Matrix.Diagonal((1.2,.3,1,1))@Matrix.LocRotScale(trace.translation,orientation,trace.to_scale());local=trace.inverted()@foodcenters[f-1]
    desired=(hands[0]+hands[1])/2+Vector((0,-.10,.03));food.matrix_world=Matrix.Translation(desired-matrix@local)@matrix
    food.keyframe_insert('location',frame=f);food.keyframe_insert('rotation_quaternion',frame=f);food.keyframe_insert('scale',frame=f)
skin=bpy.data.objects['Somangi_TemporarySmileCover'].data.materials[0].copy();skin.name='Hidden shoulder original matte skin';body.data.materials.append(skin)
skin_index=len(body.data.materials)-1
shader=next(n for n in skin.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
for key,value in [('Metallic',0),('Roughness',1),('Specular IOR Level',0)]:
    for link in list(shader.inputs[key].links):skin.node_tree.links.remove(link)
    shader.inputs[key].default_value=value
saved_normals=[n.vector.copy() for n in body.data.corner_normals]
bm=bmesh.new();bm.from_mesh(body.data);layer=bm.verts.layers.deform.active;normal_layer=bm.loops.layers.float_vector.new('OriginalOuterNormal')
for face,source in zip(bm.faces,body.data.polygons):
    for loop,index in zip(face.loops,source.loop_indices):loop[normal_layer]=saved_normals[index]
uv_layer=bm.loops.layers.uv.active
for name in ['Body','Arm.L','Arm.R']:
    group=body.vertex_groups[name].index;vertices=[v for v in bm.verts if v[layer].get(group,0)>.999]
    bmesh.ops.remove_doubles(bm,verts=vertices,dist=5e-7);selected=set(vertices)
    edges=[e for e in bm.edges if e.is_boundary and all(v in selected for v in e.verts)]
    oldfaces=set(bm.faces);fill_socket(bm,edges,layer,group,skin_index)
    result={'faces':[f for f in bm.faces if f not in oldfaces]}
    for face in result['faces']:
        face.material_index=skin_index;face.smooth=True;part=1 if face.calc_center_median().x>0 else 2
        for loop in face.loops:loop[uv_layer].uv=socket_uv[part];loop[normal_layer]=(0,0,0)
    print('CLOSE',name,len(edges),len(result['faces']))
    merged=[v for v in bm.verts if v[layer].get(group,0)>.999]
    bmesh.ops.remove_doubles(bm,verts=merged,dist=2e-6)
# The socket sits inside the original upper-arm volume, not on the torso.
root_group=body.vertex_groups['Body'].index
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update()
print('LOCAL CONNECTION',smooth_connection(bm,layer,root_group,normal_layer,torso_original,skin_index))
# Only normals along the new concealed patch seam are averaged. Outer positions stay fixed.
seams=set()
for edge in bm.edges:
    if len(edge.link_faces)==2 and len({f.material_index==skin_index for f in edge.link_faces})==2:
        seams.update(edge.verts)
near=set(seams)
for _ in range(3):
    near.update(v for vertex in list(near) for edge in vertex.link_edges for v in edge.verts)
for vertex in near:
    for loop in vertex.link_loops:loop[normal_layer]=vertex.normal
normals=[loop[normal_layer][:] for face in bm.faces for loop in face.loops]
bm.to_mesh(body.data);bm.free();body.data.update();body.data.normals_split_custom_set(normals)
from mathutils.kdtree import KDTree
preservation={}
for part,name in [(0,'Body'),(1,'Arm.L'),(2,'Arm.R')]:
    group=body.vertex_groups[name].index;vertices=[v for v in body.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)]
    tree=KDTree(len(vertices))
    for i,v in enumerate(vertices):tree.insert(v.co,i)
    tree.balance();source=base[groups[part]]
    if part==0:
        region=(np.abs((source[:,2]+.335)/.155)<1)&(np.abs(source[:,1])<.17)&(np.abs(source[:,0])>.18)
        source=source[~region]
    preservation[name]=dict(vertices=len(source),maxPositionError=max(tree.find(p)[2] for p in source))
(P/'preservation.json').write_text(json.dumps(preservation,indent=2))
scene.frame_set(91);bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','WholeArm_NoElbow_Eat')
(P/'metadata.json').write_text(json.dumps(dict(centers={str(k):list(v) for k,v in centers.items()},palms={str(k):list(v) for k,v in palms.items()},nativeOriginalVertices=len(original),noElbowJoints=True,wholeArmRigidRotation=True)))
