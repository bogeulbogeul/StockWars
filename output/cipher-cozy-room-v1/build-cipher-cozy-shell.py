"""Native Blender shell; game doorway positions and open exit are preserved."""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import box, material, extrude, arch_outline

out=Path('C:/GitHub/StockWars/output/cipher-cozy-room-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
wall=material('Cozy_Warm_Ivory',(.83,.785,.68))
cream=material('Cozy_Cream_Molding',(.92,.865,.75))
blue=material('Cozy_Muted_Blue',(.065,.16,.25))
floor=material('Cozy_Cream_Tile',(.86,.795,.66))
seam=material('Cozy_Subtle_Grout',(.79,.73,.62))
box('Room_Floor',(10,7.6,.14),(0,0,-.07),floor,.035)
box('Room_Back_Wall',(10.28,.16,3),(0,3.88,1.5),wall,.035)
for side in [-1,1]:
    body=box('Room_Side_Wall',(.16,7.6,3),(side*5.08,0,1.5),wall,.025)
    cutter=extrude('Doorway_Cutter',arch_outline(.66,1.14,bottom=-.05),-.35,.35,wall,0)
    cutter.rotation_euler.z=math.pi/2;cutter.location=(side*5.08,1,0)
    bpy.context.view_layer.objects.active=body
    mod=body.modifiers.new('True_Arched_Door_Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
    for start,end in [(-3.8,-1.79),(-.21,3.8)]:
        # Blender Y is the inverse of the game's floor Z.
        box('Side_Blue_Skirting',(.10,end-start,.24),(side*4.95,-(start+end)/2,.12),blue,.025)
    box('Corner_Pilaster',(.31,.31,2.88),(side*4.83,3.63,1.44),cream,.065)
    box('Corner_Base',(.44,.44,.18),(side*4.83,3.63,.09),cream,.055)
    box('Corner_Capital',(.48,.48,.24),(side*4.83,3.63,2.84),cream,.065)
    box('Side_Cornice',(.20,7.6,.16),(side*4.98,0,2.92),cream,.055)
box('Back_Blue_Skirting',(10,.12,.24),(0,3.74,.12),blue,.03)
box('Back_Cornice',(10,.24,.17),(0,3.76,2.92),cream,.055)
box('Back_Cornice_Lower',(9.75,.13,.065),(0,3.72,2.80),cream,.025)
# Larger tiles; avoid deep geometry or heavy dark grid lines.
for x in [-4,-2,0,2,4]: box('Floor_Grout',(.004,7.54,.002),(x,0,.001),seam,.0005)
for y in [-2.8,-.8,1.2,3.2]: box('Floor_Grout',(9.94,.004,.002),(0,y,.001),seam,.0005)
bulb=material('Sconce_Warm_Glow',(1,.81,.40))
shader=bulb.node_tree.nodes['Principled BSDF']
shader.inputs['Emission Color'].default_value=(1,.64,.20,1)
shader.inputs['Emission Strength'].default_value=1.6
for x in [-3.1,3.1]:
    box('Sconce_Wall_Mount',(.17,.11,.29),(x,3.68,2.04),cream,.055)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.13,location=(x,3.56,2.20))
    lamp=bpy.context.object;lamp.name='Sconce_Globe';lamp.data.materials.append(bulb)
    for polygon in lamp.data.polygons: polygon.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-cozy-room.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-cozy-room.glb'),export_format='GLB')

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.13,.14,.16,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
bpy.ops.object.light_add(type='AREA',location=(-3,-4,9))
bpy.context.object.data.energy=1400;bpy.context.object.data.size=8
for x in [-3.1,3.1]:
    bpy.ops.object.light_add(type='POINT',location=(x,3.37,2.2))
    bpy.context.object.data.energy=9;bpy.context.object.data.color=(1,.72,.38);bpy.context.object.data.shadow_soft_size=.25
bpy.ops.object.camera_add(location=(8,-12,10))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,.2,.9))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=14.4;scene.camera=camera
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'room-shell.png');bpy.ops.render.render(write_still=True)
