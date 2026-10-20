"""Village post office exterior design; placement and postal gameplay are pending."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
sys.path.insert(0, str(ROOT.parent / 'bookstore-exterior-clean-v1'))
from exterior_geometry import material, box, extrude, arch_outline, stroke
from bookstore_window import surround
from bookstore_door import build_door
from post_sign import build_sign
from post_mailbox import build_mailbox

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Post_Cream_Plaster', (.88,.79,.63))
wood = material('Post_Honey_Timber', (.45,.235,.085))
roof = material('Post_Terracotta_Tiles', (.44,.115,.075))
stone = material('Post_Cream_Stone', (.65,.56,.45))
glass = material('Post_Blue_Glass', (.16,.30,.37), .5)
gold = material('Post_Brass', (.82,.54,.16), .5)
red = material('Post_Mailbox_Red', (.52,.065,.045))
paper = material('Post_Envelope_Ivory', (.96,.86,.65))
dark = material('Post_Deep_Red_Sign', (.25,.045,.035))
slot = material('Post_Slot_Shadow', (.055,.035,.025))

box('Solid_Stone_Foundation', (3.10,1.94,.23), (0,0,.115), stone,.035)
box('Cream_Walls_Windowless_Rear', (2.96,1.80,1.44), (0,0,.91), cream,.025)
for x in [-1.48,1.48]:
    for y in [-.88,.88]:
        box('Corner_Timber', (.14,.16,1.37), (x,y,.945), wood,.014)
        box('Grounded_Stone_Foot', (.24,.25,.30), (x,y,.15), stone,.025)
box('Front_Continuous_Beam', (3.20,.16,.13), (0,-.91,1.61), wood,.012)
box('Entry_Upper_Step', (.96,.40,.23), (-.92,-1.055,.115), stone,0)
box('Entry_Lower_Step', (1.10,.64,.115), (-.92,-1.19,.0575), stone,.018)
build_door(wood,glass,gold)
# Close the exposed dark door rebate at the wall/foundation/step junction.
# The threshold overlaps the wall base and both jamb feet without floating.
box('Continuous_Stone_Door_Threshold', (.96,.22,.23),
    (-.92,-.94,.115), stone,0)
# One stone solid eliminates the thin added ledge and internal contact seams.
base=bpy.data.objects['Solid_Stone_Foundation']
for name in ['Entry_Upper_Step','Continuous_Stone_Door_Threshold']:
    part=bpy.data.objects[name]
    bpy.context.view_layer.objects.active=base
    mod=base.modifiers.new('Continuous_Stone_Union','BOOLEAN')
    mod.operation='UNION';mod.solver='EXACT';mod.object=part
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(part,do_unlink=True)
mod=base.modifiers.new('Step_Edge_Finish','BEVEL');mod.width=.008;mod.segments=3
bpy.context.view_layer.objects.active=base
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=base.modifiers.new('Stone_Surface_Normals','WEIGHTED_NORMAL');mod.keep_sharp=True
bpy.ops.object.modifier_apply(modifier=mod.name)

def outline(cx, bottom, r, spring):
    return [(cx+x,bottom+z) for x,z in arch_outline(r,spring,steps=64)]

def window(name,cx):
    before=set(bpy.context.scene.objects)
    surround(name+'_Continuous_Frame',outline(cx,.52,.34,.43),
             outline(cx,.58,.28,.37),-.985,-.89,wood)
    extrude(name+'_Inset_Glass',outline(cx,.575,.285,.375),-.94,-.915,glass,.004)
    # One cross contour avoids coincident crossing faces.
    w=.018; x=cx; z=.94; r=.29
    pts=[(x-w,.565),(x+w,.565),(x+w,z-w),(x+r,z-w),
         (x+r,z+w),(x+w,z+w),(x+w,1.235),(x-w,1.235),
         (x-w,z+w),(x-r,z+w),(x-r,z-w),(x-w,z-w)]
    extrude(name+'_Joined_Cross',pts,-.961,-.935,wood,.003)
    return set(bpy.context.scene.objects)-before

window('Front_Window',.20)
objects=window('Right_Window',0)
pivot=bpy.data.objects.new('Right_Window_Pivot',None)
bpy.context.collection.objects.link(pivot)
for o in objects:o.parent=pivot
pivot.rotation_euler.z=math.pi/2
pivot.location.x=.57

def height(x):
    return 1.72+.72*max(0,math.cos(x/1.72*math.pi/2))**1.2

profile=[(-1.72+3.44*i/128,height(-1.72+3.44*i/128)) for i in range(129)]
extrude('Sealed_Curved_Roof',profile+[(x,z-.09) for x,z in reversed(profile)],-1.04,1.04,roof,.009)
for a,b in [(-1.061,-1.014),(1.014,1.061)]:
    p=[(-1.708+3.416*i/128,height(-1.708+3.416*i/128)) for i in range(129)]
    extrude('Continuous_Curved_Timber_Edge',[(x,z-.04) for x,z in p]+[(x,z-.13) for x,z in reversed(p)],a,b,wood,.007)
for a,b in [(-.905,-.865),(.865,.905)]:
    p=[(x,z-.09) for x,z in profile if abs(x)<1.49]
    extrude('Cream_Gable',[(-1.48,1.59),(1.48,1.59)]+list(reversed(p)),a,b,cream,.006)
for i in range(18):
    xa=-1.72+3.44*i/18
    p=[(xa+.005+(3.44/18-.01)*k/8,height(xa+.005+(3.44/18-.01)*k/8)+.014) for k in range(9)]
    for j in range(7):
        extrude('Rounded_Terracotta_Tile',p+[(x,z-.03) for x,z in reversed(p)],-1.036+j*2.072/7,-1.036+(j+1)*2.072/7-.009,roof,.005)

build_sign(wood,gold,paper,dark,red)

# Grounded collection box leaves the entry steps clear.
before_mailbox = set(bpy.context.scene.objects)
build_mailbox(stone,red,gold,slot)

# Keep the complete box and foot clear of the foundation front edge (-.97).
for obj in set(bpy.context.scene.objects) - before_mailbox:
    obj.location.y -= .24

asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'PostOffice.glb'),export_format='GLB',use_selection=True)
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
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.8;scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,-.08,1.15))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'PostOffice.blend'))
cam.location=(1.6,-4,1.7)
cam.rotation_euler=(Vector((-.49,-.95,.25))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=.70
scene.render.filepath=str(ROOT/'entry-joint-close.png');bpy.ops.render.render(write_still=True)
cam.location=(1.6,-5,2.65)
cam.rotation_euler=(Vector((0,-1.04,1.98))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.24
scene.render.filepath=str(ROOT/'sign-close.png');bpy.ops.render.render(write_still=True)
cam.location=(3.0,-5,2.0)
cam.rotation_euler=(Vector((1.02,-1.29,.55))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=1.35
scene.render.filepath=str(ROOT/'mailbox-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'Exterior design; user review and game placement pending','reference':'output/bookstore-exterior-clean-v1/front-right.png','style':'smooth matte native village geometry','mesh_count':sum(o.type=='MESH' for o in asset),'rear_windows':0,'postal_gameplay':'not implemented'},indent=2),encoding='utf-8')
