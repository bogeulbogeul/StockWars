"""Low cream/blue double-door storage cabinet, without separate top props."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-cabinet-v1';out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Cabinet_Cream',(.92,.865,.75));blue=material('Cabinet_Muted_Blue',(.065,.16,.25))
dark=material('Cabinet_Shadow_Seam',(.035,.09,.145))
for x in [-.58,.58]:
    for y in [-.23,.23]:box('Cabinet_Short_Foot',(.11,.11,.14),(x,y,.07),cream,.035)
box('Cabinet_Rounded_Body',(1.44,.65,.65),(0,0,.455),cream,.065)
box('Cabinet_Cream_Top',(1.48,.69,.08),(0,0,.79),cream,.035)
box('Cabinet_Door_Recess',(1.30,.025,.53),(0,-.328,.45),dark,.025)
for side in [-1,1]:
    name='Left' if side<0 else 'Right'
    box('Cabinet_Blue_Door_'+name,(.626,.034,.51),(side*.322,-.348,.45),blue,.022)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(side*.075,-.384,.45))
    knob=bpy.context.object;knob.name='Cabinet_Round_Knob_'+name;knob.scale=(.024,.020,.024)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);knob.data.materials.append(cream)
    for polygon in knob.data.polygons:polygon.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-cabinet.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-cabinet.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Studio',(200,200,.01),(0,0,-.015),material('Studio',(.60,.61,.63)),0)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.2,-3.6,2.1));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.42))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.15;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'cabinet-preview.png');bpy.ops.render.render(write_still=True)
