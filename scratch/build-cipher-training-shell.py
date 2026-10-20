"""Empty training room shell, preserving room for future seated workstations."""
import bpy, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import box,material
out=Path('C:/GitHub/StockWars/output/cipher-training-shell-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
wall=material('Warm_Ivory',(.83,.785,.68));cream=material('Cream_Trim',(.92,.865,.75))
blue=material('Muted_Blue',(.065,.16,.25));floor=material('Cream_Tile',(.86,.795,.66))
seam=material('Subtle_Grout',(.79,.73,.62))
box('Training_Floor',(7.2,5.4,.14),(0,0,-.07),floor,.035)
box('Training_Back_Wall',(7.48,.16,3),(0,2.78,1.5),wall,.035)
for side in [-1,1]:
    box('Training_Side_Wall',(.16,5.4,3),(side*3.68,0,1.5),wall,.025)
    box('Side_Blue_Skirting',(.10,5.4,.24),(side*3.55,0,.12),blue,.025)
    box('Side_Cornice',(.20,5.4,.16),(side*3.58,0,2.92),cream,.055)
    box('Corner_Pilaster',(.31,.31,2.88),(side*3.43,2.53,1.44),cream,.065)
    box('Corner_Base',(.44,.44,.18),(side*3.43,2.53,.09),cream,.055)
    box('Corner_Capital',(.48,.48,.24),(side*3.43,2.53,2.84),cream,.065)
box('Back_Blue_Skirting',(7.2,.12,.24),(0,2.64,.12),blue,.03)
box('Back_Cornice',(7.2,.24,.17),(0,2.66,2.92),cream,.055)
box('Back_Cornice_Lower',(6.95,.13,.065),(0,2.62,2.80),cream,.025)
for x in [-2.4,-.8,.8,2.4]:box('Floor_Grout',(.004,5.34,.002),(x,0,.001),seam,.0005)
for y in [-1.8,0,1.8]:box('Floor_Grout',(7.14,.004,.002),(0,y,.001),seam,.0005)
# No furniture or display is included in this first room-shell stage.
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-shell.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-shell.glb'),export_format='GLB')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
bpy.ops.object.light_add(type='AREA',location=(-3,-4,8));bpy.context.object.data.energy=1300;bpy.context.object.data.size=7
bpy.ops.object.camera_add(location=(0,-12,8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.8))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=9.6;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'room-shell.png');bpy.ops.render.render(write_still=True)
