import bpy,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-v6/somangi-eat.blend'))
s=bpy.context.scene;head=bpy.data.objects['Somangi_Body'];mouth=bpy.data.objects['Mouth_Animated'];rig=bpy.data.objects['Somangi_Rig'];s.frame_set(1)
shader=head.data.materials[0].node_tree.nodes.get('Principled BSDF');clean=head.data.materials[0].copy();clean.name='Temporary clean mouth patch'
original=bpy.data.images.load(str(P.parent/'somangi-smile-v1/base-original.png'));original.pack();shader.inputs['Base Color'].links[0].from_node.image=original
cam=s.camera;cam.location=(0,-6,0);target=Vector((0,-.1,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6;s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16
mouth.hide_render=True;s.render.filepath=str(P/'reference-original-mouth.png');bpy.ops.render.render(write_still=True);mouth.hide_render=False
# Reuse the original head UVs on a tiny temporary eraser, rather than redrawing its smile.
mesh=head.data;uv=mesh.uv_layers.active
polys=[p for p in mesh.polygons if any(abs(mesh.vertices[i].co.x)<.15 and .18<mesh.vertices[i].co.z<.35 and mesh.vertices[i].co.y<-.33 for i in p.vertices)]
ids=sorted({i for p in polys for i in p.vertices});mapping={i:j for j,i in enumerate(ids)}
data=bpy.data.meshes.new('Original-mouth temporary eraser');data.from_pydata([mesh.vertices[i].co+mesh.vertices[i].normal*.0008 for i in ids],[],[[mapping[i] for i in p.vertices] for p in polys]);data.materials.append(clean)
layer=data.uv_layers.new(name='UVMap')
for poly,source in zip(data.polygons,polys):
 poly.use_smooth=True
 for a,b in zip(poly.loop_indices,source.loop_indices):layer.data[a].uv=uv.data[b].uv
patch=bpy.data.objects.new('Mouth_Eraser',data);bpy.context.collection.objects.link(patch);patch.parent=rig
vg=patch.vertex_groups.new(name='Head');vg.add(list(range(len(data.vertices))),1,'REPLACE');mod=patch.modifiers.new('Follow Head','ARMATURE');mod.object=rig
patch.shape_key_add(name='Basis');hide=patch.shape_key_add(name='Hide_Overlay');smile=mouth.data.shape_keys.key_blocks['Rest_Smile']
inside=Vector((0,-.25,.278))
for v in hide.data:v.co=inside
for v in smile.data:v.co=inside
for frame in range(1,74):
 s.frame_set(frame);hidden=0 if 26<=frame<=55 else 1
 smile.value=hidden;smile.keyframe_insert('value',frame=frame);hide.value=hidden;hide.keyframe_insert('value',frame=frame)
s.frame_set(1);s.render.filepath=str(P/'eat-rest.png');bpy.ops.render.render(write_still=True)
s.frame_set(34)
for name,pos in [('eat-front',(0,-6,0)),('eat-side',(6,-.1,0)),('eat-angle',(2.5,-6,.7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Food_Bun','Mouth_Animated','Mouth_Eraser']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE',export_cameras=False,export_lights=False)
sys.path.insert(0,str(P.parent/'somangi-eat-v4'));from merge_clips import merge_clips
merge_clips(P/'somangi-eat.glb');print('EXACT_ORIGINAL_SMILE_RESTORED')
