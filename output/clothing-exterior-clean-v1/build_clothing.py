"""Native matte clothing shop; preserve teal roof, pink awnings and hanger signs."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke
sys.path.insert(0, str(ROOT))
from clothing_sign import build_front_sign

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Clothing_Cream', (.88,.79,.63))
wood = material('Clothing_Honey_Wood', (.45,.235,.085))
teal = material('Clothing_Teal_Roof', (.045,.30,.31))
stone = material('Clothing_Smooth_Stone', (.65,.56,.45))
glass = material('Clothing_Blue_Glass', (.22,.36,.43), .5)
gold = material('Clothing_Brass', (.82,.54,.16), .55)
pink = material('Clothing_Rose', (.72,.13,.23))
blush = material('Clothing_Blush', (.94,.32,.42))
leaf = material('Clothing_Leaf', (.13,.28,.12))

box('Foundation',(3.12,2.04,.20),(0,0,.10),stone,.035)
box('Smooth_Walls_Windowless_Back',(2.98,1.88,1.42),(0,0,.90),cream,.025)
box('Front_Continuous_Beam',(3.12,.14,.12),(0,-.97,1.55),wood,.015)
for x in [-1.43,1.43]:
    for y in [-.93,.93]:
        box('Corner_Pilaster',(.14,.17,1.30),(x,y,.86),cream,.015)
        box('Pilaster_Foot',(.24,.25,.28),(x,y,.14),stone,.025)
box('Entry_Upper_Step',(1.04,.35,.15),(0,-1.06,.14),stone,.025)
box('Entry_Lower_Step',(1.20,.30,.07),(0,-1.29,.035),stone,.025)

def arch(name,x,bottom,r,spring,mat,front=-.985,back=-.95):
    return extrude(name,[(x+a,bottom+b) for a,b in arch_outline(r,spring)],front,back,mat,.008)

arch_ring('Door_Arch_Frame',0,.21,.34,.72,.065,-1.035,-.94,wood)
# Real divided arched leaves, with inset glass contained by timber.
for sign in [-1,1]:
    half=[(sign*.007,.21),(sign*.333,.21),(sign*.333,.93)]
    half += [(sign*.333*math.cos(math.pi*i/128),.93+.333*math.sin(math.pi*i/128)) for i in range(1,65)]
    half[-1]=(sign*.007,1.263)
    if sign<0: half.reverse()
    extrude('Entry_Double_Door_Leaf',half,-1.002,-.95,wood,.004)
    x=sign*.171
    arch('Door_Inset_Glass',x,.69,.115,.27,glass,-1.009,-1.001)
    box('Door_Lower_Panel',(.245,.016,.32),(x,-1.012,.42),wood,.012)
    disk('Door_Brass_Knob',sign*.055,-1.045,.645,.024,.035,gold)

for x in [-.91,.91]:
    arch('Front_Window_Glass',x,.39,.32,.56,glass)
    arch_ring('Front_Window_Frame',x,.39,.32,.56,.045,-1.023,-.94,wood)
    # A single cross solid avoids coincident faces at the mullion junction.
    h=.013
    cross=[(-h,.39),(h,.39),(h,.94-h),(.315,.94-h),
           (.315,.94+h),(h,.94+h),(h,1.25),(-h,1.25),
           (-h,.94+h),(-.315,.94+h),(-.315,.94-h),(-h,.94-h)]
    extrude('Window_Unified_Cross',[(x+a,z) for a,z in cross],-1.0095,-.9845,wood,.003)
    box('Window_Sill',(.76,.14,.065),(x,-.98,.36),wood,.012)
    # Four broad stripes and scalloped valance, without rough fabric texture.
    for i in range(4):
        xa=x-.40+i*.20
        extrude('Pink_Striped_Awning',[(xa,1.325),(xa+.20,1.325),(xa+.20,1.30),(xa,1.30)],-1.31,-.95,pink if i%2==0 else blush,.006)
        o=bpy.context.object
        # Slope top toward the wall; front remains low.
        for v in o.data.vertices:
            v.co.z+=(v.co.y+1.31)/.36*.24
        scallop=[(xa,1.325),(xa+.20,1.325)]+[(xa+.10+.10*math.cos(t),1.30-.10*math.sin(t)) for t in [math.pi*j/24 for j in range(25)]]
        extrude('Awning_Rounded_Valance',scallop,-1.325,-1.295,pink if i%2==0 else blush,.004)

def height(x):
    return 1.60+.66*max(0,math.cos(x/1.69*math.pi/2))**1.4
profile=[(-1.69+3.38*i/80,height(-1.69+3.38*i/80)) for i in range(81)]
extrude('Sealed_Teal_Roof',profile+[(x,z-.09) for x,z in reversed(profile)],-1.04,1.08,teal,.012)
for a,b in [(-1.065,-1.015),(1.035,1.085)]:
    # Recess the end caps so they cannot share the roof's exterior end plane.
    edge=[(-1.684+3.368*i/80,height(-1.684+3.368*i/80)) for i in range(81)]
    extrude('Honey_Curved_Roof_Edge',[(x,z-.055) for x,z in edge]+[(x,z-.13) for x,z in reversed(edge)],a,b,wood,.008)
for a,b in [(-.95,-.90),(.90,.95)]:
    inner=[(x,z-.09) for x,z in profile if abs(x)<1.49]
    extrude('Cream_Gable',[(-1.49,1.53),(1.49,1.53)]+list(reversed(inner)),a,b,cream,.008)
for i in range(14):
    xa=-1.69+i*3.38/14
    curve=[(xa+.003+(3.38/14-.006)*k/6,height(xa+.003+(3.38/14-.006)*k/6)+.015) for k in range(7)]
    for j in range(7):
        extrude('Rounded_Teal_Tile',curve+[(x,z-.035) for x,z in reversed(curve)],-1.037+j*2.12/7,-1.04+(j+1)*2.12/7-.008,teal,.008)

build_front_sign(wood)
# Side hanging sign and its mounting hardware retired at user request.

asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1200;scene.render.resolution_y=1000
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object
    lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.5;scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,-.08,1.1))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'ClothingStore-clean.blend'))
cam.location=(.65,-5,2.45)
cam.rotation_euler=(Vector((0,-1.05,1.86))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.13
scene.render.resolution_x=1100;scene.render.resolution_y=850
scene.render.filepath=str(ROOT/'sign-close.png');bpy.ops.render.render(write_still=True)
cam.location=(1.3,-5,1.8)
cam.rotation_euler=(Vector((.91,-1,.94))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=.65
scene.render.filepath=str(ROOT/'window-close.png');bpy.ops.render.render(write_still=True)
cam.location=(3.8,-4,2.25)
cam.rotation_euler=(Vector((1.65,-1.01,1.58))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=.43
scene.render.filepath=str(ROOT/'roof-tip-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'Model built; user art and live contact review pending','reference':'output/clothing-book-retouch-final/ClothingStore-no-planter.png','style':'native smooth matte geometry matching furniture and office','rear':'windowless','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')
