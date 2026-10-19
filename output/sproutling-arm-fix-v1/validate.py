import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'sproutling-arms-separated.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert sorted(o.name for o in meshes)==['Arm.L','Arm.R','Body']
assert all(len(o.data.uv_layers)>0 for o in meshes)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.render.resolution_x=800;s.render.resolution_y=800;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.45,.45,1)
for location,power,size in [((2,-4,4),450,4),((-3,-1,1),180,3)]:
 bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.2;s.camera=cam
s.render.filepath=str(P/'textured-front.png');bpy.ops.render.render(write_still=True)
for o in meshes:
 if o.name.startswith('Arm.'):
  pivot=o.matrix_world.translation.copy()
  o.matrix_world=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-35 if o.name=='Arm.L' else 35),4,'Y')@Matrix.Translation(-pivot)@o.matrix_world
s.render.filepath=str(P/'rotation-check.png');bpy.ops.render.render(write_still=True)
(P/'validation.json').write_text(json.dumps({'glb_reimport':True,'objects':[o.name for o in meshes],'uv_layers_present':True,'rotation_preview_degrees':35,'armature_added':False},indent=2))
