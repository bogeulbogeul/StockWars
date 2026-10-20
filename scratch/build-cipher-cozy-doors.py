import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,extrude,arch_ring,disk,stroke

out=Path('C:/GitHub/StockWars/output/cipher-cozy-doors-v1');out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
cream=material('Door_Cream',(.92,.865,.75))
blue=material('Door_Blue',(.045,.13,.24))
dark=material('Door_Recess_Blue',(.025,.07,.13))
ink=material('Door_Panel_Line',(.035,.10,.19))
glow=material('Door_Lamp_Glow',(1,.84,.46))
shader=glow.node_tree.nodes['Principled BSDF']
shader.inputs['Emission Color'].default_value=(1,.67,.25,1)
shader.inputs['Emission Strength'].default_value=1.4

def convert_curves():
    for obj in list(bpy.context.scene.objects):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
            bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')

def export(name):
    convert_curves()
    bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{name}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(out/f'{name}.glb'),export_format='GLB')

arch_ring('Door_Frame',0,0,.64,1.14,.12,-.11,.025,cream)
for side in [-1,1]:
    r=.62
    contour=[(side*.004,0),(side*r,0),(side*r,1.14)]
    contour += [(side*r*math.cos(t),1.14+r*math.sin(t)) for t in [i*math.pi/2/32 for i in range(1,33)]]
    extrude('Door_Leaf_Left' if side<0 else 'Door_Leaf_Right',contour,-.012,.025,blue,.008)
    path=[(side*.09,-.024,.15),(side*.52,-.024,.15),(side*.52,-.024,1.14)]
    path += [(side*.52*math.cos(t),-.024,1.14+.52*math.sin(t)) for t in [i*1.39/28 for i in range(1,29)]]
    path += [(side*.09,-.024,.15)]
    stroke('Door_Inset_Outline',path,.007,ink)
    box('Door_Ivory_Handle',(.05,.055,.22),(side*.10,-.060,.74),cream,.022)
box('Door_Threshold',(1.50,.15,.025),(0,-.015,.0125),cream,.008)
for x in [-1.03,1.03]:
    box('Door_Sconce_Mount',(.12,.09,.23),(x,-.045,1.36),cream,.035)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.105,location=(x,-.15,1.49))
    lamp=bpy.context.object;lamp.name='Door_Sconce_Globe';lamp.data.materials.append(glow)
    for polygon in lamp.data.polygons:polygon.use_smooth=True
export('Cipher-arched-double-door')
door_objects=list(bpy.context.scene.objects)

sign_sets={}
for kind in ['training','competition']:
    for obj in list(bpy.context.scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
    disk('Sign_Cream_Rim',0,-.05,0,.35,.08,cream)
    disk('Sign_Blue_Face',0,-.097,0,.292,.022,blue)
    if kind=='training':
        for x,h in [(-.12,.12),(0,.22),(.12,.32)]:
            box('Sign_Chart_Bar',(.08,.018,h),(x,-.12,-.16+h/2),cream,.012)
        box('Sign_Chart_Base',(.38,.018,.025),(0,-.12,-.18),cream,.009)
    else:
        extrude('Sign_Trophy_Cup',[(-.13,.15),(.13,.15),(.10,.03),(.04,-.035),(-.04,-.035),(-.10,.03)],-.13,-.112,cream,.008)
        box('Sign_Trophy_Stem',(.04,.018,.10),(0,-.12,-.075),cream,.009)
        box('Sign_Trophy_Base',(.22,.018,.04),(0,-.12,-.14),cream,.01)
        for side in [-1,1]:
            stroke('Sign_Trophy_Handle',[(side*x,-.12,z) for x,z in [(.13,.12),(.20,.12),(.19,.04),(.14,0),(.09,0)]],.016,cream)
    export(f'Cipher-sign-{kind}')

# Compose a studio preview from the exported independent assets.
for obj in list(bpy.context.scene.objects):bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(out/'Cipher-arched-double-door.glb'))
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(out/'Cipher-sign-competition.glb'))
for obj in set(bpy.data.objects)-before:obj.location.z+=2.39
box('Preview_Wall',(2.7,.10,3.0),(0,.1,1.5),material('Wall',(.83,.785,.68)),.02)
box('Preview_Floor',(5,4,.04),(0,-1,-.03),material('Floor',(.86,.795,.66)),.01)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(3,-5,3.3));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1.3))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=3.3;scene.camera=camera
scene.render.resolution_x=1050;scene.render.resolution_y=1250;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'door-sign-preview.png');bpy.ops.render.render(write_still=True)
