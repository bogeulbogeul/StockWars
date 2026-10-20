"""A standalone copy of the accepted lobby door, without lamps or signage."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-return-door-v1';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-cozy-doors-v1/Cipher-arched-double-door.blend'))
for obj in list(bpy.context.scene.objects):
    if 'Sconce' in obj.name:bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-return-door.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-return-door.glb'),export_format='GLB')
sys.path.insert(0,str(root/'scratch'))
from exterior_geometry import box,material
box('Studio_Wall',(2.4,.1,2.3),(0,.10,1.15),material('Wall',(.83,.785,.68)),.02)
box('Studio_Floor',(5,4,.04),(0,-1,-.03),material('Floor',(.86,.795,.66)),.01)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.4,-5,2.6));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.96))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.5;scene.camera=camera
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'door-preview.png');bpy.ops.render.render(write_still=True)
