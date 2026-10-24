import bpy,bmesh,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-smooth-side-seam-v40/pre-body-remesh.blend'));scene=bpy.context.scene;scene.frame_set(136);body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];mapping={int(k):v for k,v in json.loads((P.parent/'somangi-smooth-side-seam-v40/vertex-map.json').read_text()).items()};head={mapping[i] for i in json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']};ag={body.vertex_groups[n].index for n in ['Arm.L','Arm.R']}
# Preserve the existing head and whole rigid arms.
mesh=body.data;keep=[any(i in head for i in f.vertices) or all(any(g.group in ag and g.weight>.999 for g in mesh.vertices[i].groups) for i in f.vertices) for f in mesh.polygons];bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[f for f,k in zip(list(bm.faces),keep) if not k],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bm.to_mesh(mesh);bm.free()
with bpy.data.libraries.load(str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend')) as (src,dst):dst.objects=['Somangi_SmoothBody']
torso=dst.objects[0];scene.collection.objects.link(torso);torso.name='Torso_surface';torso.parent=None;torso.modifiers.clear();oldhead=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);oldag={torso.vertex_groups[n].index for n in ['Arm.L','Arm.R']};mesh=torso.data;remove=[any(i in oldhead for i in f.vertices) or any(any(g.group in oldag and g.weight>.999 for g in mesh.vertices[i].groups) for i in f.vertices) for f in mesh.polygons];bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[f for f,k in zip(list(bm.faces),remove) if k],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));top=[e for e in bm.edges if e.is_boundary and all(v.co.z>-.065 for v in e.verts)];bmesh.ops.holes_fill(bm,edges=top,sides=0);bm.to_mesh(mesh);bm.free();mesh.update()
reference=torso.copy();reference.data=torso.data.copy();scene.collection.objects.link(reference);reference.hide_render=True
bpy.ops.object.select_all(action='DESELECT');torso.select_set(True);bpy.context.view_layer.objects.active=torso
solid=torso.modifiers.new('Close thin construction gaps','SOLIDIFY');solid.thickness=.006;solid.offset=-1;solid.use_even_offset=False;solid.use_quality_normals=True;bpy.ops.object.modifier_apply(modifier=solid.name)
print('SOLID',len(torso.data.vertices),tuple(torso.dimensions),flush=True)
assert max(torso.dimensions)<2
remesh=torso.modifiers.new('Unified torso surface','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.003;remesh.use_smooth_shade=True;remesh.use_remove_disconnected=False;bpy.ops.object.modifier_apply(modifier=remesh.name)
print('REMESH',len(torso.data.vertices),len(torso.data.polygons),flush=True)
mask=torso.vertex_groups.new(name='Shoulder_cleanup')
a=np.empty(len(torso.data.vertices)*3,dtype=np.float32);torso.data.vertices.foreach_get('co',a);a=a.reshape(-1,3);x,y,z=a.T
w=np.clip((z+.48)/.08,0,1)*np.clip((-.015-z)/.035,0,1)*np.clip((np.abs(x)-.14)/.06,0,1)*np.clip((.22-np.abs(y))/.06,0,1);quant=np.rint(w*128).astype(int)
for bucket in np.unique(quant):
 if bucket>0:mask.add(np.flatnonzero(quant==bucket).tolist(),float(bucket)/128,'REPLACE')
print('MASK',flush=True)
modifier=torso.modifiers.new('Fair original shoulder surface','SMOOTH');modifier.vertex_group=mask.name;modifier.factor=.65;modifier.iterations=30;bpy.ops.object.modifier_apply(modifier=modifier.name)
print('SMOOTH',flush=True)
# Recover the original broad torso curve, removing fine overlapping-surface marks.
source=np.array([v.co[:] for v in reference.data.vertices]);height=[];curves=[];radii=[]
for z in np.linspace(-.48,-.015,160):
 sample=source[(np.abs(source[:,2]-z)<.012)&(np.abs(source[:,1])>.14)&(np.abs(source[:,0])<.35)]
 if len(sample)<15:continue
 y=sample[:,1];A=np.column_stack([np.ones(len(y)),y,y*y]);c=np.linalg.lstsq(A,sample[:,0]**2,rcond=None)[0]
 band=source[np.abs(source[:,2]-z)<.008]
 if c[2]>=0 or not len(band):continue
 height.append(z);curves.append(c);radii.append(np.quantile(np.abs(band[:,0]),.995))
height=np.array(height);curves=np.array(curves);radii=np.array(radii)
for j in range(3):curves[:,j]=np.convolve(np.pad(curves[:,j],(3,3),mode='edge'),np.ones(7)/7,mode='valid')
radii=np.convolve(np.pad(radii,(3,3),mode='edge'),np.ones(7)/7,mode='valid');curves[:,0]=radii*radii+curves[:,1]**2/(4*curves[:,2])
parameter=(height+.25)/.25;depth=radii/np.sqrt(-curves[:,2]);center=-curves[:,1]/(2*curves[:,2]);radii=np.polyval(np.polyfit(parameter,radii,3),parameter);depth=np.clip(np.polyval(np.polyfit(parameter,depth,3),parameter),.13,.36);center=np.polyval(np.polyfit(parameter,center,2),parameter);curves[:,2]=-(radii/depth)**2;curves[:,1]=-2*curves[:,2]*center;curves[:,0]=radii*radii+curves[:,2]*center*center
a=np.empty(len(torso.data.vertices)*3,dtype=np.float32);normal=np.empty_like(a);torso.data.vertices.foreach_get('co',a);torso.data.vertices.foreach_get('normal',normal);a=a.reshape(-1,3);normal=normal.reshape(-1,3);x,y,z=a.T;sign=np.sign(x);ease=lambda t:np.clip(t,0,1)**2*(3-2*np.clip(t,0,1));weight=ease((np.abs(x)-.16)/.05)*ease((.22-np.abs(y))/.09)*ease((z+.46)/.07)*ease((-.005-z)/.05)
c=np.column_stack([np.interp(z,height,curves[:,j]) for j in range(3)]);radius=np.sqrt(np.maximum(.001,c[:,0]+c[:,1]*y+c[:,2]*y*y));inner=normal[:,0]*sign<0;target=sign*(radius-inner*.006);a[:,0]=x+(target-x)*weight;torso.data.vertices.foreach_set('co',a.ravel());torso.data.update();print('ORIGINAL_ENVELOPE',flush=True)
# Keep inner shell surfaces inside; only the visible lower surface is projected.
from mathutils.bvhtree import BVHTree
source_tree=BVHTree.FromPolygons([v.co for v in reference.data.vertices],[list(f.vertices) for f in reference.data.polygons])
coordinates=np.empty(len(torso.data.vertices)*3,dtype=np.float32);normals=np.empty_like(coordinates);torso.data.vertices.foreach_get('co',coordinates);torso.data.vertices.foreach_get('normal',normals);coordinates=coordinates.reshape(-1,3);normals=normals.reshape(-1,3)
from mathutils import Vector
for i in np.flatnonzero(coordinates[:,2]<-.42):
 point,normal,_,distance=source_tree.find_nearest(Vector(coordinates[i]))
 if point is not None and np.dot(normals[i],normal)>0:
  t=float(np.clip((-.42-coordinates[i,2])/.035,0,1));coordinates[i]=coordinates[i]*(1-t)+np.array(point)*t
torso.data.vertices.foreach_set('co',coordinates.ravel());torso.data.update();print('LOWER_SURFACE',flush=True)
modifier=torso.modifiers.new('Compact smooth topology','DECIMATE');modifier.ratio=.20;bpy.ops.object.modifier_apply(modifier=modifier.name);print('DECIMATED',flush=True)
bpy.data.objects.remove(reference,do_unlink=True);torso.vertex_groups.clear();bg=torso.vertex_groups.new(name='Body');hg=torso.vertex_groups.new(name='Head')
a=np.empty(len(torso.data.vertices)*3,dtype=np.float32);torso.data.vertices.foreach_get('co',a);a=a.reshape(-1,3);x,y,z=a.T;ease=lambda t:np.clip(t,0,1)**3*(np.clip(t,0,1)*(np.clip(t,0,1)*6-15)+10);radius=np.maximum(np.abs(x)/.41,np.abs(y)/.28);w=ease((z+.24)/.215)*(1-ease((radius-.9)/.35));quant=np.rint(w*4096).astype(int)
for bucket in np.unique(quant):
 ids=np.flatnonzero(quant==bucket).tolist();weight=float(bucket)/4096
 if weight<1:bg.add(ids,1-weight,'REPLACE')
 if weight>0:hg.add(ids,weight,'REPLACE')
print('WEIGHTS',len(torso.data.vertices),flush=True)
for f in torso.data.polygons:f.material_index=2;f.use_smooth=True
torso.parent=rig;modifier=torso.modifiers.new('Torso head transition','ARMATURE');modifier.object=rig
body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='Somangi_SmoothBody';bpy.ops.object.select_all(action='SELECT')
ids={n:[v.index for v in body.data.vertices if any(g.group==body.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']};(P/'arm-vertices.json').write_text(json.dumps(ids))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','UnifiedTorso_RigidArms')

