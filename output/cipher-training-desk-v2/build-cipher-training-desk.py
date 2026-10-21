"""Native training desk only: open knee space, no chair or electronics."""
import bpy, bmesh, math, sys, ast
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,finish,box
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-desk-v1';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Reuse the accepted desk's rounded slab construction, not its solid front body.
tree=ast.parse((root/'scratch/build-cipher-cozy-desk.py').read_text())
function=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='rounded_slab')
exec(compile(ast.Module(body=[function],type_ignores=[]),'<rounded-slab>','exec'))
cream=material('Training_Desk_Cream',(.92,.865,.75))
blue=material('Training_Desk_Blue',(.065,.16,.25))
rounded_slab('Training_Desk_Rounded_Top',2.6,1.1,.22,.62,.10,cream)
for side in [-1,1]:
    foot=rounded_slab('Training_Desk_Cream_Foot',.46,.98,.15,0,.09,cream);foot.location.x=side*1.08
    column=rounded_slab('Training_Desk_Blue_Support',.36,.90,.14,.09,.53,blue);column.location.x=side*1.08
box('Training_Desk_Rear_Brace',(1.86,.12,.12),(0,.40,.56),cream,.04)
# Front and central underside remain empty: 180w x 62h game units.
deps=bpy.context.evaluated_depsgraph_get()
for x in [-.65,0,.65]:
    hit=bpy.context.scene.ray_cast(deps,Vector((x,-.8,.40)),Vector((0,1,0)),distance=1.05)
    assert not hit[0], 'Knee access obstructed'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-desk.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-desk.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio_Ground',(200,200,.01),(0,0,-.015),material('Ground',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.6,-5,2.7));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.5;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'desk-preview.png');bpy.ops.render.render(write_still=True)
print('PASS: open knee space at three sampled lateral positions')
