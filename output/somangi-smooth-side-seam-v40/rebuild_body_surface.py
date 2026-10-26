import bpy,bmesh,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P/'pre-body-remesh.blend'));scene=bpy.context.scene;scene.frame_set(136);body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];mapping={int(k):v for k,v in json.loads((P/'vertex-map.json').read_text()).items()};head={mapping[i] for i in json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']};ag={body.vertex_groups[n].index for n in ['Arm.L','Arm.R']}
# Preserve the existing head and whole rigid arms.
mesh=body.data;keep=[any(i in head for i in f.vertices) or all(any(g.group in ag and g.weight>.999 for g in mesh.vertices[i].groups) for i in f.vertices) for f in mesh.polygons];bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[f for f,k in zip(list(bm.faces),keep) if not k],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bm.to_mesh(mesh);bm.free()
with bpy.data.libraries.load(str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend')) as (src,dst):dst.objects=['Somangi_SmoothBody']
torso=dst.objects[0];scene.collection.objects.link(torso);torso.name='Torso_surface';torso.parent=None;torso.modifiers.clear();oldhead=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);oldag={torso.vertex_groups[n].index for n in ['Arm.L','Arm.R']};mesh=torso.data;remove=[any(i in oldhead for i in f.vertices) or any(any(g.group in oldag and g.weight>.999 for g in mesh.vertices[i].groups) for i in f.vertices) for f in mesh.polygons];bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[f for f,k in zip(list(bm.faces),remove) if k],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');top=[e for e in bm.edges if e.is_boundary and all(v.co.z>-.065 for v in e.verts)];bmesh.ops.holes_fill(bm,edges=top,sides=0);bm.to_mesh(mesh);bm.free();mesh.update()
reference=torso.copy();reference.data=torso.data.copy();scene.collection.objects.link(reference);reference.hide_render=True
bpy.ops.object.select_all(action='DESELECT');torso.select_set(True);bpy.context.view_layer.objects.active=torso
remesh=torso.modifiers.new('Unified torso surface','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0025;remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
print('REMESH',len(torso.data.vertices),len(torso.data.polygons))
mask=torso.vertex_groups.new(name='Shoulder_cleanup')
for v in torso.data.vertices:
 x,y,z=v.co;w=float(np.clip((z+.48)/.08,0,1)*np.clip((-.015-z)/.035,0,1)*np.clip((abs(x)-.14)/.06,0,1)*np.clip((.22-abs(y))/.06,0,1))
 if w>0:mask.add([v.index],w,'REPLACE')
modifier=torso.modifiers.new('Fair original shoulder surface','SMOOTH');modifier.vertex_group=mask.name;modifier.factor=.65;modifier.iterations=10;bpy.ops.object.modifier_apply(modifier=modifier.name)
mask=torso.vertex_groups.new(name='Original_lower_surface')
for v in torso.data.vertices:
 w=float(np.clip((-.42-v.co.z)/.035,0,1))
 if w:mask.add([v.index],w,'REPLACE')
modifier=torso.modifiers.new('Preserve lower original surface','SHRINKWRAP');modifier.target=reference;modifier.vertex_group=mask.name;modifier.wrap_method='NEAREST_SURFACEPOINT';modifier.wrap_mode='ON_SURFACE';bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.data.objects.remove(reference,do_unlink=True);torso.vertex_groups.clear();bg=torso.vertex_groups.new(name='Body');hg=torso.vertex_groups.new(name='Head')
for v in torso.data.vertices:
 x,y,z=v.co;ease=lambda t:np.clip(t,0,1)**3*(np.clip(t,0,1)*(np.clip(t,0,1)*6-15)+10);radius=max(abs(x)/.41,abs(y)/.28);w=float(ease((z+.24)/.215)*(1-ease((radius-.9)/.35)))
 if w<1:bg.add([v.index],1-w,'REPLACE')
 if w>0:hg.add([v.index],w,'REPLACE')
for f in torso.data.polygons:f.material_index=2;f.use_smooth=True
torso.parent=rig;modifier=torso.modifiers.new('Torso head transition','ARMATURE');modifier.object=rig
body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='Somangi_SmoothBody';bpy.ops.object.select_all(action='SELECT')
ids={n:[v.index for v in body.data.vertices if any(g.group==body.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']};(P/'arm-vertices.json').write_text(json.dumps(ids))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','UnifiedTorso_RigidArms')
