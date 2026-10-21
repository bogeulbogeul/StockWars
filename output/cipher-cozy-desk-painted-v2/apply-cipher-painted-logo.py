import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import extrude, box, material
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-cozy-desk-painted-v2'
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-cozy-desk-v1/Cipher-cozy-desk.blend'))
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Desk_Logo_','Desk_Ivory_Oval_')):bpy.data.objects.remove(obj,do_unlink=True)
cream=bpy.data.materials['Desk_Cream']
badge=extrude('Desk_Painted_Oval_Badge',[(.49*math.cos(i*math.tau/64),.34+.20*math.sin(i*math.tau/64)) for i in range(64)],-.505,-.465,cream,.006)
paint=bpy.data.materials.new('Desk_Printed_Logo');paint.use_nodes=True
shader=paint.node_tree.nodes['Principled BSDF'];shader.inputs['Roughness'].default_value=.9
image=bpy.data.images.load(str(out/'desk-logo.png'));image.pack()
node=paint.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
paint.node_tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
badge.data.materials.append(paint)
uv=badge.data.uv_layers.new()
for polygon in badge.data.polygons:
    if polygon.normal.y<-.5:
        polygon.material_index=1
        for loop in polygon.loop_indices:
            v=badge.data.vertices[badge.data.loops[loop].vertex_index].co
            uv.data[loop].uv=(v.x/.98+.5,(v.z-.34)/.40+.5)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-desk.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-desk.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(3,-5,3));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=3.9;scene.camera=camera
scene.render.resolution_x=1300;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'desk-preview.png');bpy.ops.render.render(write_still=True)
