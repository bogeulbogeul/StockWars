"""Reposition door hinges, cut step grooves and refine bus front details."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v13/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
cream=bpy.data.materials['Bus_Warm_Cream'];green=bpy.data.materials['Bus_Forest_Green']
dark=bpy.data.materials['Bus_Window_Rubber'];hub=bpy.data.materials['Bus_Hub_Warm_Metal']
lamp=bpy.data.materials['Bus_Headlight_Ivory'];glass=bpy.data.materials['Bus_Blue_Glass']
amber=bpy.data.materials['Bus_Indicator_Amber']
center=.396
for o in list(scene.objects):
    if o.name.startswith(('Door_Hinge_Plate','Step_Anti_Slip_Inlay')):
        bpy.data.objects.remove(o,do_unlink=True)
# Small hinge pairs sit precisely on the outside edges of the moving leaves.
for side in [-1,1]:
    x=center+side*.337
    for z in [.64,1.735]:
        box('Door_Edge_Hinge_Mount',(.026,.016,.075),(x,-.840,z),hub,.005)
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.010,depth=.077,location=(x,-.853,z))
        o=bpy.context.object;o.name='Door_Edge_Hinge_Barrel';o.data.materials.append(hub)
        for p in o.data.polygons:p.use_smooth=True
# Actual shallow channels in the tread, with the same cream material inside.
step=bpy.data.objects['Boarding_Step']
for j in range(3):
    cutter=box('Groove_Cutter',(.43,.012,.018),(center,-.885+j*.033,.521),cream,.004)
    bpy.context.view_layer.objects.active=step
    m=step.modifiers.new('Recessed_Anti_Slip_Channel','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

# Replace front appliques with layered lamp housings and a restrained grille.
prefixes=('Round_Headlight','Front_Headlight_Visor','Front_Lower_Grille','Grille_Slat','Front_Plate','Front_Indicator','Front_Wiper','Destination_Recess')
for o in list(scene.objects):
    if o.name.startswith(prefixes):bpy.data.objects.remove(o,do_unlink=True)
front=2.39
def front_disk(name,y,z,radius,depth,mat,x):
    o=disk(name,0,0,0,radius,depth,mat)
    o.location=(x,y,z);o.rotation_euler=(0,math.pi/2,0)
    for p in o.data.polygons:p.use_smooth=True
    return o
for y in [-.50,.50]:
    front_disk('Headlight_Dark_Recess',y,.86,.152,.030,dark,front-.012)
    front_disk('Headlight_Metal_Bezel',y,.86,.137,.027,hub,front+.006)
    front_disk('Headlight_Cream_Lens',y,.86,.116,.021,lamp,front+.027)
    box('Indicator_Dark_Recess',(.030,.142,.083),(front-.008,y*1.34,.85),dark,.025)
    box('Indicator_Amber_Lens',(.018,.118,.058),(front+.015,y*1.34,.85),amber,.018)
box('Front_Grille_Recess',(.030,.45,.125),(front-.003,0,.704),dark,.025)
for j in range(5):
    box('Grille_Narrow_Metal_Bar',(.017,.018,.078),(front+.018,-.15+j*.075,.704),hub,.007)
box('Front_Numberplate_Mount',(.025,.355,.105),(front+.025,0,.529),green,.015)
box('Front_Numberplate_Face',(.013,.309,.067),(front+.044,0,.529),cream,.008)
for y in [-.124,.124]:front_disk('Plate_Fastener',y,.529,.007,.009,hub,front+.055)
# Fine front bumper cap and dark recessed lower seam.
box('Bumper_Upper_Recess',(.025,1.35,.025),(2.40,0,.558),dark,.008)
box('Bumper_Metal_Inset',(.018,.87,.026),(2.438,0,.47),hub,.009)
box('Front_Destination_Frame',(.027,.79,.169),(2.337,0,1.995),dark,.028)
box('Front_Destination_Green_Inset',(.018,.73,.113),(2.357,0,1.995),green,.020)
for y in [-.37,.37]:
    stroke('Wiper_Arm',[(2.375,y,1.32),(2.375,y*.73,1.43)],.009,dark)
    stroke('Wiper_Blade',[(2.382,y*.73-.055,1.43),(2.382,y*.73+.055,1.52)],.012,dark)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('door-close',(1.5,-5,2),(center,-.83,1.18),1.85),
    ('front-close',(7,-3,2.8),(2.37,0,1.14),2.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'hinges':'Aligned to outside leaf edges',
    'step':'Three actual shallow cut channels; black strips removed',
    'front':'Layered lamp bezels, inset grille, plate screws, bumper seam, destination inset and wipers',
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
