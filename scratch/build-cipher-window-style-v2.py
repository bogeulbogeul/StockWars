import bpy
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import box, extrude, arch_outline, arch_ring

root=Path('C:/GitHub/StockWars')
out=root/'output/cipher-exterior-windows-v2'
out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-exterior-clock-v1/CipherSecurities-clock.blend'))
prefixes=('Front_Window_','Window_Cross_','Window_Sill','Window_Bottom_')
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(prefixes): bpy.data.objects.remove(obj,do_unlink=True)
cream=bpy.data.materials['Trim_Cream']
glass=bpy.data.materials['Window_Muted_Blue']
for sign in [-1,1]:
    x=sign*.77; bottom=.39; radius=.20; spring=.24
    extrude('Front_Window_Glass',[(x+px,bottom+pz) for px,pz in arch_outline(radius,spring)],-.922,-.89,glass,.007)
    arch_ring('Front_Window_Frame',x,bottom,radius,spring,.047,-.957,-.88,cream)
    box('Window_Sill',(.55,.16,.045),(x,-.929,bottom-.015),cream,.013)
    box('Window_Bottom_Rail',(.40,.026,.028),(x,-.938,bottom+.014),cream,.005)
    # Both ends meet the frame; the crossing has a slight depth offset to avoid z-fighting.
    box('Window_Cross_Vertical',(.025,.022,.44),(x,-.936,bottom+.22),cream,.004)
    box('Window_Cross_Horizontal',(.40,.022,.025),(x,-.939,bottom+.24),cream,.004)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'CipherSecurities-clock.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'CipherSecurities-clock.glb'),export_format='GLB',
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.84,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6))
bpy.context.object.data.energy=350;bpy.context.object.data.size=5
bpy.ops.object.camera_add()
camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
for name,location,target,scale,width,height in [
    ('window-detail',(-1.5,-3.5,1.3),(-.77,-.93,.63),.9,850,850),
    ('front-right',(4,-6,3.5),(0,-.03,1.03),3.65,1400,1200)]:
    camera.location=location;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=scale
    scene.render.resolution_x=width;scene.render.resolution_y=height;scene.render.resolution_percentage=100
    scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
