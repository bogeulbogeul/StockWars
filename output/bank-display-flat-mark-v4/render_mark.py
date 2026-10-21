"""Render the adopted bank mark unchanged for the terminal's flat UI."""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'bank-interior-gold-sign-v1/Bank-gold-wall-sign.glb'))
pts=[o.matrix_world@Vector(c) for o in bpy.context.scene.objects if o.type=='MESH' for c in o.bound_box]
lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);target=(lo+hi)/2
# Flat emission colors retain the adopted coin's exact leaf and rim geometry.
flat=bpy.data.materials.new('Flat_Gold');flat.use_nodes=True
nodes=flat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs['Color'].default_value=(.72,.46,.105,1);flat.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
groove=flat.copy();groove.name='Flat_Engraving';groove.node_tree.nodes.get('Emission').inputs['Color'].default_value=(.40,.23,.045,1)
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 o.data.materials.clear();o.data.materials.append(flat);o.data.materials.append(groove)
 for p in o.data.polygons:
  depth=sum((o.matrix_world@o.data.vertices[i].co).y for i in p.vertices)/len(p.vertices)
  p.material_index=1 if depth>2.891 else 0
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
for delta,power,size in [((-2,-3,3),300,3),((2,-2,1),80,2)]:
 bpy.ops.object.light_add(type='AREA',location=target+Vector(delta));o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=target+Vector((0,-4,0)));cam=bpy.context.object;scene.camera=cam;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=max(hi.x-lo.x,hi.z-lo.z)*1.04
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(ROOT/'adopted-bank-mark.png');bpy.ops.render.render(write_still=True)
