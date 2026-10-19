import bpy
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import box, material

out = Path('C:/GitHub/StockWars/output/cipher-entry-mat-v1')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
blue = material('Mat_Blue_Fabric',(.03,.1,.2),1)
mat = box('Cipher_Entry_Mat',(1.8,.95,.015),(0,0,.0075),blue,.006)
top = bpy.data.materials.new('Mat_Woven_Logo')
top.use_nodes = True
shader = top.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = 1
image = bpy.data.images.load(str(out/'mat-texture.png'))
image.pack()
node = top.node_tree.nodes.new('ShaderNodeTexImage')
node.image = image
top.node_tree.links.new(node.outputs['Color'], shader.inputs['Base Color'])
mat.data.materials.append(top)
uv = mat.data.uv_layers.active or mat.data.uv_layers.new()
for polygon in mat.data.polygons:
    if polygon.normal.z > .5:
        polygon.material_index = 1
        for loop in polygon.loop_indices:
            v = mat.data.vertices[mat.data.loops[loop].vertex_index].co
            uv.data[loop].uv = (v.x/1.8+.5,v.y/.95+.5)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-entry-mat.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-entry-mat.glb'),export_format='GLB')
scene = bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world.color=(.5,.5,.5)
box('Ground',(200,200,.01),(0,0,-.012),material('Ground',(.55,.57,.60)),0)
bpy.ops.object.light_add(type='AREA',location=(-2,-3,4))
bpy.context.object.data.energy=300
bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(1.5,-2,2.8))
camera=bpy.context.object
camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=2.5
scene.camera=camera
scene.render.resolution_x=1100
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.render.filepath=str(out/'mat-preview.png')
bpy.ops.render.render(write_still=True)
