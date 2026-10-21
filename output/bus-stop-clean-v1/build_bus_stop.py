"""Smooth matte bus shelter preserving the existing village prop design."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,extrude,disk,stroke
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Shelter_Honey_Wood',(.46,.25,.10))
backwood=material('Shelter_Back_Wood',(.36,.18,.065))
roof=material('Shelter_Terracotta',(.62,.16,.065))
stone=material('Shelter_Cream_Stone',(.76,.67,.52))
cream=material('Sign_Ivory',(.95,.86,.65))
metal=material('Sign_Warm_Bronze',(.27,.18,.105))
ink=material('Bus_Pictogram',(.09,.15,.17))
glass=material('Lantern_Warm_Glass',(.98,.76,.38))
p=glass.node_tree.nodes.get('Principled BSDF')
p.inputs['Emission Color'].default_value=(1,.65,.22,1)
p.inputs['Emission Strength'].default_value=.25

box('Smooth_Stone_Platform',(3.25,1.48,.15),(0,0,.075),stone,.055)
for x in [-1.36,1.36]:
    for y in [-.48,.48]:
        box('Post_Stone_Foot',(.28,.28,.24),(x,y,.27),stone,.03)
        box('Shelter_Post',(.17,.17,1.75),(x,y,1.18),wood,.022)
for i in range(7):
    box('Smooth_Back_Plank',(2.62,.095,.225),(0,.49,.49+i*.228),backwood,.009)
box('Front_Header',(2.92,.18,.16),(0,-.48,2.02),wood,.018)
box('Rear_Header',(2.92,.18,.16),(0,.48,2.02),wood,.018)
for x in [-1.36,1.36]:
    box('Side_Header',(.17,1.13,.14),(x,0,2.02),wood,.018)
    for z in [.62,.91]:box('Side_Rail',(.10,.98,.10),(x,0,z),wood,.014)
    # Chamfered knee braces meet the header and post without rough grain.
    sign=1 if x<0 else -1
    contour=[(x,1.60),(x+sign*.11,1.60),(x+sign*.46,1.96),(x+sign*.27,1.96)]
    extrude('Header_Knee_Brace',contour,-.55,-.41,wood,.014)
box('Bench_Seat',(2.25,.41,.12),(0,.18,.68),wood,.035)
for x in [-.91,.91]:
    box('Bench_Leg',(.14,.28,.48),(x,.18,.40),wood,.018)
box('Bench_Lower_Beam',(1.95,.10,.10),(0,.25,.39),backwood,.013)

# Shallow pitched tiled roof, ridge runs left to right.
pitch=math.atan2(.36,.83)
for side in [-1,1]:
    o=box('Sealed_Roof_Half',(3.49,.93,.095),(0,side*.405,2.25),roof,.02)
    o.rotation_euler[0]=-side*pitch
    for row in range(3):
        y=side*(.14+row*.27)
        z=2.43-abs(y)*math.tan(pitch)+.045
        for col in range(10):
            tile=box('Rounded_Terracotta_Tile',(.337,.302,.055),(-1.565+col*.348,y,z),roof,.014)
            tile.rotation_euler[0]=-side*pitch
    box('Timber_Eave',(3.50,.11,.13),(0,side*.835,2.10),wood,.016)
box('Rounded_Ridge_Cap',(3.55,.17,.13),(0,0,2.48),roof,.055)
# Continuous pitched side rafters close the exposed roof ends and join eaves.
for x in [-1.705,1.705]:
    for side in [-1,1]:
        rafter=box('Continuous_Side_Rafter',(.105,.96,.13),
                   (x-math.copysign(.012 if side>0 else 0,x),side*.405,2.205),wood,.012)
        rafter.rotation_euler[0]=-side*pitch
    box('Side_Rafter_Tie',(.095,1.77,.10),(x-math.copysign(.022,x),0,2.055),wood,.012)
    # Short transverse bearers connect the cantilevered edge back to the posts.
    for y in [-.48,.48]:
        box('Roof_Post_Bearer',(.42,.17,.14),
            (math.copysign(1.535,x),y,2.055),wood,.012)
    box('Ridge_Support',(.085,.105,.34),(x-math.copysign(.035,x),0,2.23),wood,.012)

# Right sign is fastened to the shelter; front bus pictogram is real geometry.
box('Sign_Bracket',(.48,.10,.09),(1.61,-.48,1.86),metal,.018)
box('Sign_Back_Bracket',(.48,.10,.09),(1.61,-.48,1.16),metal,.018)
box('Sign_Outer_Frame',(.64,.105,.96),(1.95,-.48,1.51),metal,.065)
box('Sign_Inset',(.545,.028,.86),(1.95,-.548,1.51),cream,.052)
box('Bus_Icon_Body',(.33,.025,.42),(1.95,-.575,1.51),ink,.055)
box('Bus_Icon_Window',(.245,.018,.15),(1.95,-.594,1.60),cream,.025)
for x in [1.84,2.06]:
    box('Bus_Icon_Wheel',(.065,.025,.09),(x,-.58,1.28),ink,.018)
    disk('Bus_Icon_Headlight',x,-.599,1.40,.027,.012,cream)
for x in [1.76,2.14]:box('Bus_Icon_Mirror',(.032,.025,.10),(x,-.575,1.52),ink,.012)
for x in [1.73,2.17]:
    for z in [1.14,1.88]:disk('Sign_Frame_Fastener',x,-.554,z,.016,.012,metal)

# Restrained fixed lantern on the right post, supported at the back.
box('Lantern_Mount',(.11,.10,.26),(1.36,-.59,1.78),metal,.012)
box('Lantern_Light',(.14,.12,.21),(1.36,-.70,1.71),glass,.016)
for x in [1.275,1.445]:box('Lantern_Upright',(.025,.17,.25),(x,-.70,1.71),metal,.006)
for z in [1.575,1.845]:box('Lantern_Cap',(.22,.20,.035),(1.36,-.70,z),metal,.012)

assets=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'BusStop-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Studio_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-4,-5,7),650,5),((4,2,5),350,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.9;scene.camera=cam
for name,loc in [('front',(0,-8,3.6)),('front-right',(4,-7,3.8)),('rear',(4,7,3.8))]:
    cam.location=loc;cam.rotation_euler=(Vector((.25,0,1.22))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(4,3,3.1);cam.data.ortho_scale=1.8
cam.rotation_euler=(Vector((1.5,.25,2.20))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'roof-joint-close.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'BusStop-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 model draft; user visual approval and game integration pending',
    'reference':'output/bus-stop-multiview-v1/front.png','style':'Smooth matte geometry matching current village buildings',
    'preserved':'Terracotta tiled roof, honey timber shelter, bench, cream platform, bus sign and lantern',
    'roof_fix':'Continuous pitched side rafters, transverse post bearers, tie and ridge support; offset overlapping end faces',
    'mesh_count':sum(o.type=='MESH' for o in assets),'game_modified':False},indent=2),encoding='utf-8')
