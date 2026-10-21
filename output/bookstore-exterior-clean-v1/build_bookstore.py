"""Smooth native bookstore matching the adopted village exteriors."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke
sys.path.insert(0, str(ROOT))
from bookstore_side_sign import build_side_sign, build_front_sign
from bookstore_window import build_display
from bookstore_side_window import build_side_window
from bookstore_door import build_door

bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('Bookstore_Cream',(.88,.79,.63))
wood=material('Bookstore_Honey_Timber',(.45,.235,.085))
roof=material('Bookstore_Plum_Tiles',(.24,.085,.15))
stone=material('Bookstore_Smooth_Stone',(.65,.56,.45))
glass=material('Bookstore_Slate_Glass',(.12,.23,.29),.5)
gold=material('Bookstore_Brass',(.82,.54,.16),.5)
paper=material('Bookstore_Ivory_Pages',(.95,.85,.61))
dark=material('Bookstore_Walnut_Plaque',(.19,.085,.035))
green=material('Bookstore_Green_Book',(.13,.27,.17))
red=material('Bookstore_Red_Book',(.32,.10,.085))

box('Smooth_Foundation',(3.12,1.94,.22),(-.05,0,.11),stone,.035)
box('Windowless_Rear_Walls',(2.98,1.80,1.42),(-.05,0,.92),cream,.025)
for x in [-1.48,-.36,1.48]:
    for y in [-.88,.88]:
        box('Timber_Post',(.14,.16,1.37),(x,y,.945),wood,.014)
        box('Post_Stone_Foot',(.24,.25,.30),(x,y,.15),stone,.025)
box('Continuous_Front_Beam',(3.22,.16,.13),(0,-.91,1.61),wood,.012)
# Two equal rises, solid to the ground, with a generous lower tread.
box('Entry_Upper_Step',(.96,.40,.230),(-.92,-1.055,.115),stone,.018)
box('Entry_Lower_Step',(1.10,.64,.115),(-.92,-1.19,.0575),stone,.018)
box('Entry_Flush_Threshold',(.66,.09,.012),(-.92,-.948,.230),stone,.006)

build_door(wood,glass,gold)

build_display(wood,gold,glass,red,green)
build_side_window(wood,glass)

def height(x):
    left=.75*max(0,math.cos(min(math.pi,abs((x+.94)/.80*math.pi/2))))**1.25
    right=.24*max(0,math.cos(min(math.pi,abs((x-.57)/1.18*math.pi/2))))**1.3
    return 1.72+max(left,right)

profile=[(-1.73+3.46*i/160,height(-1.73+3.46*i/160)) for i in range(161)]
extrude('Sealed_Plum_Roof',profile+[(x,z-.085) for x,z in reversed(profile)],-1.03,1.06,roof,.009)
for a,b in [(-1.048,-1.008),(1.028,1.068)]:
    # Inset timber end caps so they do not share the roof body's outer side plane.
    edge=[(-1.718+3.436*i/160,height(-1.718+3.436*i/160)) for i in range(161)]
    extrude('Curved_Honey_Roof_Edge',[(x,z-.04) for x,z in edge]+[(x,z-.12) for x,z in reversed(edge)],a,b,wood,.007)
for a,b in [(-.905,-.865),(.865,.905)]:
    p=[(-1.53,height(-1.53)-.09)]+[(x,z-.09) for x,z in profile if -1.53<x<1.43]+[(1.43,height(1.43)-.09)]
    extrude('Cream_Gable',[(-1.53,1.59),(1.43,1.59)]+list(reversed(p)),a,b,cream,.008)
for i in range(20):
    xa=-1.73+3.46*i/20
    curve=[(xa+.004+(3.46/20-.008)*k/8,height(xa+.004+(3.46/20-.008)*k/8)+.014) for k in range(9)]
    for j in range(7):
        extrude('Smooth_Plum_Tile',curve+[(x,z-.03) for x,z in reversed(curve)],-1.026+j*2.086/7,-1.026+(j+1)*2.086/7-.008,roof,.006)

build_side_sign(wood,gold,paper,dark)
build_front_sign()

asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bookstore-clean.glb'),export_format='GLB',use_selection=True)
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
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.7;scene.camera=cam
if '--roof-check' in sys.argv or '--wall-check' in sys.argv:
    for name,loc,target,scale in [
        ('front-right',(4,-6,3.5),(-.10,-.08,1.15),4.7),
        ('rear',(4,6,3.5),(-.10,-.08,1.15),4.7),
        ('roof-tip-close',(3.7,3.6,2.2),(1.72,1.05,1.68),.42),
        ('right-wall-close',(4.5,-2.5,2.2),(1.46,.05,.70),1.90)]:
        cam.location=loc;cam.data.ortho_scale=scale
        cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bookstore-clean.blend'))
    raise SystemExit(0)
for name,loc in [('front-right',(4,-6,3.5)),('front-left',(-4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc;cam.rotation_euler=(Vector((-.10,-.08,1.15))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bookstore-clean.blend'))
cam.location=(-3.3,-3.4,2.05)
cam.rotation_euler=(Vector((-1.94,-.38,1.35))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.15
scene.render.filepath=str(ROOT/'side-sign-close.png');bpy.ops.render.render(write_still=True)
cam.location=(-.65,-4,2.15)
cam.rotation_euler=(Vector((-.94,-.96,1.96))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=.98
scene.render.filepath=str(ROOT/'front-sign-close.png');bpy.ops.render.render(write_still=True)
cam.location=(2,-4,1.7)
cam.rotation_euler=(Vector((.56,-.96,.80))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.95
scene.render.filepath=str(ROOT/'window-close.png');bpy.ops.render.render(write_still=True)
cam.location=(4.5,-1.7,1.65)
cam.rotation_euler=(Vector((1.60,.15,.85))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=.91
scene.render.filepath=str(ROOT/'side-window-close.png');bpy.ops.render.render(write_still=True)
cam.location=(-2.0,-4,1.7)
cam.rotation_euler=(Vector((-.92,-.96,.80))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.36
scene.render.filepath=str(ROOT/'door-close.png');bpy.ops.render.render(write_still=True)
cam.location=(.65,-3.4,1.55)
cam.rotation_euler=(Vector((-.92,-1.15,.24))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.55
scene.render.filepath=str(ROOT/'steps-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'Native model built; final user art and live contact review pending','reference':'output/clothing-book-retouch-final/BookStoreBuilding-after.png','style':'smooth matte native geometry matching clothing and furniture','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')
