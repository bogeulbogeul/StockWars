"""Native matte store exterior; preserve Vivian's coral/cream/wood identity."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Vivian_Cream', (.86, .72, .48))
coral = material('Vivian_Coral', (.80, .19, .12))
ivory = material('Vivian_Awning_Cream', (.95, .82, .55))
wood = material('Vivian_Honey_Wood', (.39, .21, .075))
stone = material('Vivian_Beige_Base', (.65, .53, .37))
glass = material('Vivian_Slate_Glass', (.13, .20, .24))
gold = material('Vivian_Gold', (.87, .58, .10))
green = material('Vivian_Leaves', (.22, .34, .075))

box('Foundation', (2.66, 1.96, .14), (0, 0, .07), stone, .035)
box('Smooth_Cream_Walls_Windowless_Back', (2.56, 1.82, 1.39), (0, 0, .815), cream, .025)
box('Front_Fascia', (2.60, .09, .07), (0, -.95, 1.51), wood, .01)
box('Entry_Step_Upper', (.72, .26, .10), (0, -1.03, .10), stone, .02)
box('Entry_Step_Lower', (.82, .23, .05), (0, -1.20, .025), stone, .018)

def arch(name, x, bottom, r, spring, mat, front=-.96):
    return extrude(name, [(x+a, bottom+b) for a,b in arch_outline(r, spring)], front, front+.03, mat, .007)

door=arch('Central_Arched_Wood_Door', 0, .15, .245, .59, wood, -.964)
arch_ring('Door_Frame', 0, .15, .245, .59, .045, -.99, -.92, wood)
cutter=extrude('Door_Glass_Cutter',[(a,.57+b) for a,b in arch_outline(.177,.17)],-1.10,-.85,wood,0)
bpy.context.view_layer.objects.active=door
cut=door.modifiers.new('Inset_Glass_Opening','BOOLEAN')
cut.operation='DIFFERENCE'
cut.object=cutter
bpy.ops.object.modifier_apply(modifier=cut.name)
bpy.data.objects.remove(cutter,do_unlink=True)
# Oversize the recessed pane behind its rebate so bevels cannot expose the cavity.
arch('Door_Glass', 0, .557, .190, .183, glass, -.979)
arch_ring('Door_Glass_Rebate',0,.57,.177,.17,.018,-.985,-.935,wood)
box('Door_Glass_Bottom_Rebate',(.398,.055,.040),(0,-.9565,.568),wood,.003)
box('Door_Glass_Mullion_V', (.018, .012, .34), (0, -.982, .75), wood, .003)
box('Door_Glass_Mullion_H', (.35, .012, .018), (0, -.986, .72), wood, .003)
for x in [-.15, -.075, 0, .075, .15]:
    box('Door_Lower_Plank', (.006, .006, .30), (x, -.986, .34), wood, .001)
disk('Brass_Knob', -.17, -1.02, .49, .025, .025, gold)

def window(name, x, side=False):
    before = set(bpy.context.scene.objects)
    arch(name+'_Glass', x, .46, .30, .44, glass, -.956)
    arch_ring(name+'_Frame', x, .46, .30, .44, .055, -.99, -.92, wood)
    box(name+'_Bottom_Frame',(.65,.07,.035),(x,-.955,.46),wood,.007)
    box(name+'_Sill', (.75, .13, .065), (x, -.98, .43), wood, .012)
    box(name+'_Vertical', (.028, .014, .725), (x, -.961, .8225), wood, .004)
    box(name+'_Horizontal', (.60, .014, .028), (x, -.965, .87), wood, .004)
    if not side:
        box(name+'_Lower_Panel', (.64, .06, .24), (x, -.946, .285), wood, .012)
    if side:
        pivot = bpy.data.objects.new(name+'_Pivot', None)
        bpy.context.collection.objects.link(pivot)
        for obj in set(bpy.context.scene.objects)-before-{pivot}:
            obj.parent = pivot
        pivot.rotation_euler.z = math.pi/2
        pivot.location.x = .35

window('Left_Display', -.82)
window('Right_Display', .82)
# Both side elevations remain plain walls; front display windows are retained.

def height(x):
    return 1.53 + .66 * max(0, math.cos(abs(x)/1.47*math.pi/2))**1.20

profile = [(-1.47+2.94*i/64, height(-1.47+2.94*i/64)) for i in range(65)]
for name, a,b in [('Front_Gable', -.93,-.86), ('Rear_Gable_NoWindows', .86,.93)]:
    top = [(x,z-.06) for x,z in profile if abs(x)<1.29]
    extrude(name, [(-1.28,1.47),(1.28,1.47)]+list(reversed(top)), a,b,cream,.006)
extrude('Sealed_Coral_Roof', profile+[(x,z-.09) for x,z in reversed(profile)], -1.04,1.04,coral,.012)
for ya,yb in [(-1.065,-1.015),(1.015,1.065)]:
    extrude('Continuous_Wood_Eaves', [(x,z-.045) for x,z in profile]+[(x,z-.135) for x,z in reversed(profile)], ya,yb,wood,.009)
for i in range(12):
    xa=-1.47+i*.245
    curve=[(xa+.245*k/6,height(xa+.245*k/6)+.022) for k in range(7)]
    for j in range(7):
        extrude('Broad_Coral_Roof_Tile', curve+[(x,z-.045) for x,z in reversed(curve)], -1.04+j*.297,-1.04+j*.297+.289,coral,.008)

# Sloped canvas stripes with rounded hanging scallops.
for i in range(10):
    xa=-1.26+i*.252
    mat=coral if i%2==0 else ivory
    panel=box('Awning_Stripe', (.252,.49,.032), (xa+.126,-1.15,1.420), mat,.004)
    panel.rotation_euler.x=math.radians(22)
    r=.126
    contour=[(xa,1.335),(xa+.252,1.335),(xa+.252,1.255)]
    contour += [(xa+r+r*math.cos(t*math.pi/24),1.255-r*.65*math.sin(t*math.pi/24)) for t in range(1,25)]
    extrude('Awning_Scallop',contour,-1.389,-1.355,mat,.006)

# Five petals and two leaves remain Vivian's sign, no lettering.
for i in range(5):
    angle=math.pi/2+2*math.pi*i/5
    obj=disk('Flower_Petal',.115*math.cos(angle),-1.006-i*.002,1.845+.115*math.sin(angle),.09,.035,coral)
    obj.scale.z=1.16
disk('Flower_Gold_Center',0,-1.045,1.845,.075,.035,gold)
for sign in [-1,1]:
    obj=disk('Flower_Leaf',sign*.135,-.997,1.665,.075,.025,green)
    obj.scale.x=1.4
    obj.scale.z=.60
    obj.rotation_euler.y=sign*-.35

asset=list(bpy.context.scene.objects)
assert not any('Back_Window' in o.name for o in asset)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1200
scene.render.resolution_y=1100
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object
    lamp.data.energy=power
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=3.9
scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,-.08,1.08))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
for obj in scene.objects:
    obj['preview_only']=obj not in asset
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Native model and studio previews; user art review pending','design_reference':'output/meshy-buildings-v1/03-vivian-store.png','style_references':['home-single-eaves-v6','cipher-exterior-blender-v1'],'preserved':['coral roof','cream walls','honey wood','striped scalloped awning','flower sign','center door and two display windows','side window'],'rear':'windowless','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')
