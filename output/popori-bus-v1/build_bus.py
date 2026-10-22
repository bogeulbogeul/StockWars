"""Village bus based on the adopted crayon opening, in native matte 3D."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke
original_box=box
def box(name,size,loc,mat,bevel=.015):
    o=original_box(name,size,loc,mat,0)
    if bevel:
        m=o.modifiers.new('Smooth_Rounded_Edges','BEVEL');m.width=bevel;m.segments=12
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
        for p in o.data.polygons:p.use_smooth=True
        m=o.modifiers.new('Smooth_Panel_Normals','WEIGHTED_NORMAL');m.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o
bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('Bus_Warm_Cream',(.88,.80,.62))
green=material('Bus_Forest_Green',(.12,.29,.21))
glass=material('Bus_Blue_Glass',(.17,.31,.37),.38)
dark=material('Bus_Window_Rubber',(.07,.095,.09))
rubber=material('Bus_Tire_Rubber',(.045,.052,.05))
hub=material('Bus_Hub_Warm_Metal',(.43,.43,.36),.55)
lamp=material('Bus_Headlight_Ivory',(.98,.89,.64),.4)
amber=material('Bus_Indicator_Amber',(.94,.37,.06),.5)
red=material('Bus_Rear_Lamp',(.58,.09,.055),.5)
blue=material('Bus_Seat_Blue',(.10,.24,.40))
# Length along X, front at +X, boarding side at -Y. Wheel bottoms z=0.
box('Cream_Rounded_Coach',(3.85,1.58,1.61),(0,0,1.27),cream,.18)
box('Green_Lower_Body',(3.90,1.63,.62),(0,0,.76),green,.13)
box('Cream_Roof_Cap',(3.76,1.57,.17),(-.02,0,2.075),cream,.075)
box('Chassis',(3.45,1.35,.15),(0,0,.43),dark,.025)
for x in [-1.20,1.18]:
    for y in [-.78,.78]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.39,depth=.22,location=(x,y,.39),rotation=(math.pi/2,0,0))
        o=bpy.context.object;o.name='Road_Wheel';o.data.materials.append(rubber)
        bevel=o.modifiers.new('Soft_Tire_Shoulders','BEVEL');bevel.width=.055;bevel.segments=6
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
        for p in o.data.polygons:p.use_smooth=True
        disk('Wheel_Hub',x,y+math.copysign(.121,y),.39,.22,.035,hub)
        disk('Wheel_Centre',x,y+math.copysign(.144,y),.39,.085,.02,green)

# Large windows with continuous dark seals and inset colored glazing.
for side in [-1,1]:
    for x in [-1.25,-.45,.35]:
        if side==-1 and x==.35:continue
        box('Side_Window_Seal',(.70,.032,.67),(x,side*.792,1.57),dark,.065)
        box('Side_Window_Glass',(.61,.021,.58),(x,side*.814,1.57),glass,.052)
    box('Driver_Side_Window_Seal',(.61,.035,.67),(1.27,side*.792,1.57),dark,.06)
    box('Driver_Side_Window_Glass',(.52,.022,.58),(1.27,side*.815,1.57),glass,.045)
# Tall double boarding door, closed and split into separate leaves for later work.
for x in [.42,.77]:
    box('Boarding_Door_Frame',(.345,.045,1.34),(x,-.805,1.17),green,.026)
    box('Boarding_Door_Glass',(.265,.018,.93),(x,-.835,1.36),glass,.022)
    box('Boarding_Door_Lower_Panel',(.265,.02,.21),(x,-.835,.72),cream,.012)
box('Boarding_Door_Centre_Seal',(.018,.026,1.26),(.595,-.84,1.17),dark,.006)
box('Boarding_Step',(.79,.19,.09),(.595,-.84,.475),hub,.018)

# Front/rear panels, round lamps and small restrained details.
box('Front_Windscreen_Seal',(.04,1.29,.67),(1.932,0,1.57),dark,.065)
box('Front_Windscreen',(.025,1.17,.55),(1.96,0,1.57),glass,.055)
box('Rear_Window_Seal',(.04,1.21,.62),(-1.932,0,1.56),dark,.055)
box('Rear_Window',(.024,1.10,.51),(-1.957,0,1.56),glass,.045)
box('Destination_Recess',(.031,.74,.16),(1.943,0,1.995),green,.035)
box('Front_Bumper',(.17,1.47,.14),(1.94,0,.48),cream,.045)
box('Rear_Bumper',(.17,1.47,.14),(-1.94,0,.48),cream,.045)
for y in [-.50,.50]:
    o=disk('Round_Headlight_Rim',0,0,0,.148,.035,dark)
    o.location=(1.973,y,.86);o.rotation_euler=(0,math.pi/2,0)
    o=disk('Round_Headlight',0,0,0,.117,.04,lamp)
    o.location=(1.997,y,.86);o.rotation_euler=(0,math.pi/2,0)
    box('Front_Indicator',(.045,.14,.10),(1.988,y*1.34,.85),amber,.025)
    box('Rear_Stoplight',(.04,.14,.22),(-1.99,y,.82),red,.025)
    stroke('Front_Wiper',[(1.986,y*.6,1.33),(1.986,y*.75,1.49)],.012,dark)
for y in [-.92,.92]:
    stroke('Mirror_Arm',[(1.64,y*.82,1.86),(1.78,y,1.86),(1.78,y,1.65)],.021,dark)
    box('Side_Mirror',(.14,.075,.25),(1.78,y,1.66),dark,.032)
box('Front_Lower_Grille',(.04,.40,.10),(1.991,0,.69),dark,.02)
for y in [-.12,0,.12]:box('Grille_Slat',(.012,.035,.065),(2.016,y,.69),hub,.008)
# Keep blue seats as separate objects for future interior/boarding work.
for x in [-1.3,-.55,.15]:
    for y in [-.43,.43]:
        box('Blue_Seat_Cushion',(.41,.36,.10),(x,y,.99),blue,.035)
        box('Blue_Seat_Back',(.08,.36,.44),(x-.20,y,1.22),blue,.035)
assets=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=900
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Studio_Gray',(.72,.74,.77)),0)
for loc,power,size in [((3,-5,7),800,5),((-4,3,5),450,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.3;scene.camera=cam
for name,loc in [('front-right',(6,-8,4.3)),('side',(0,-9,2.8)),('front',(8,0,2.8)),('rear',(-6,8,4.3))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 bus model draft; user visual acceptance, character scale/contact and game integration pending',
    'opening_review':{'file':'web/assets/opening/opening-scene-06-v1/scene.html','duration_seconds':30,'boarding_fade_seconds':[7.8,10.2],
    'references':['boarding-crayon.png','journey-crayon.png']},
    'design':'Cream and forest green rounded bus; large blue windows; round headlights; blue seats; separate door leaves and wheels',
    'orientation':'Front +X, boarding side -Y, Z up; wheel bottoms Z=0','game_modified':False,'animation_clips':[]},indent=2),encoding='utf-8')
