"""Smooth native settlement office, preserving its green/cream/wood identity."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Office_Cream', (.88, .79, .60))
green = material('Office_Sage_Roof', (.24, .38, .20))
wood = material('Office_Honey_Wood', (.43, .25, .10))
stone = material('Office_Smooth_Base', (.67, .57, .42))
glass = material('Office_Window_Soft_Blue_Glass', (.32, .52, .61), .45)
glass_shader=glass.node_tree.nodes.get('Principled BSDF')
glass_shader.inputs['Emission Color'].default_value=(.12,.23,.28,1)
glass_shader.inputs['Emission Strength'].default_value=.18
gold = material('Office_Brass', (.79, .51, .12))
leaf = material('Office_Sprout', (.27, .43, .14))

box('Foundation', (3.10, 1.97, .16), (0, 0, .08), stone, .04)
box('Smooth_Walls_Windowless_Back', (2.98, 1.84, 1.35), (0, 0, .825), cream, .035)
box('Wood_Fascia', (3.10, 1.94, .10), (0, 0, 1.48), wood, .018)
for x in [-1.43, 1.43]:
    box('Corner_Post', (.10, 1.87, 1.25), (x, 0, .80), cream, .02)
box('Entry_Upper_Step', (1.32, .34, .12), (0, -1.05, .10), stone, .025)
box('Entry_Lower_Step', (1.44, .27, .065), (0, -1.25, .0325), stone, .02)

def arch(name, x, bottom, r, spring, mat, front=-.955):
    return extrude(name, [(x+a, bottom+b) for a,b in arch_outline(r, spring)], front, front+.035, mat, .008)

arch('Central_Wood_Door', 0, .16, .285, .62, wood)
arch_ring('Door_Cream_Frame', 0, .16, .285, .62, .065, -.99, -.92, stone)
for x in [-.20, -.10, 0, .10, .20]:
    box('Door_Plank_Seam', (.007, .008, .60), (x, -.963, .48), wood, .002)
disk('Brass_Handle', -.19, -1.01, .55, .035, .03, gold)

def window(name, x, side=False):
    before = set(bpy.context.scene.objects)
    arch(name+'_Glass', x, .47, .255, .41, glass)
    arch_ring(name+'_Wood_Frame', x, .47, .255, .41, .044, -.984, -.92, wood)
    box(name+'_Sill', (.65, .13, .065), (x, -.97, .44), stone, .015)
    # Recess the cross into the glazing plane, behind the outer arch frame.
    # One closed cross-shaped solid: no overlapping coplanar front faces.
    half_v=.023/2
    half_h=.023/2
    low,high=.795-.65/2,.795+.65/2
    cross=[(-half_v,low),(half_v,low),
           (half_v,.86-half_h),(.255,.86-half_h),
           (.255,.86+half_h),(half_v,.86+half_h),
           (half_v,high),(-half_v,high),
           (-half_v,.86+half_h),(-.255,.86+half_h),
           (-.255,.86-half_h),(-half_v,.86-half_h)]
    extrude(name+'_Unified_Cross',[(x+a,z) for a,z in cross],-.964,-.952,wood,.003)
    if side:
        pivot = bpy.data.objects.new(name+'_Pivot', None)
        bpy.context.collection.objects.link(pivot)
        for obj in set(bpy.context.scene.objects)-before-{pivot}:
            obj.parent = pivot
        pivot.rotation_euler.z = math.pi/2
        pivot.location.x = .55

window('Front_Left_Window', -.99)
window('Front_Right_Window', .99)
window('Right_Side_Window', 0, True)
for x in [-.51, .51]:
    box('Porch_Post', (.115, .12, 1.03), (x, -1.03, .77), wood, .025)
    # Sink the base into the landing; overlap also closes the bevel seam.
    box('Porch_Post_Base', (.20, .22, .21), (x, -1.03, .225), stone, .025)
    box('Porch_Post_Cap', (.18, .19, .07), (x, -1.03, 1.27), wood, .015)

def roof_height(x):
    return 1.51 + .62 * max(0, math.cos(abs(x)/1.68*math.pi/2))**1.2

profile = [(-1.68+3.36*i/64, roof_height(-1.68+3.36*i/64)) for i in range(65)]
for name, a,b in [('Front_Gable', -.94,-.88), ('Rear_Gable_NoWindows', .88,.94)]:
    top = [(x,z-.06) for x,z in profile if abs(x)<1.50]
    extrude(name, [(-1.49,1.46),(1.49,1.46)]+list(reversed(top)), a,b,cream,.008)
extrude('Sealed_Sage_Roof', profile+[(x,z-.10) for x,z in reversed(profile)], -1.06,1.06,green,.014)
for a,b in [(-1.08,-1.03),(1.03,1.08)]:
    extrude('Wood_Roof_Edge', [(x,z-.055) for x,z in profile]+[(x,z-.14) for x,z in reversed(profile)], a,b,wood,.012)
for i in range(14):
    xa=-1.68+i*.24
    curve=[(xa+.24*k/6,roof_height(xa+.24*k/6)+.018) for k in range(7)]
    for j in range(7):
        extrude('Broad_Green_Tile', curve+[(x,z-.04) for x,z in reversed(curve)], -1.06+j*.303,-1.06+j*.303+.294,green,.009)

# Raised central entrance gable retains the original office silhouette.
crest=[(-.70+1.40*i/128,1.29+.60*math.cos(math.pi*(-.70+1.40*i/128)/1.40))
       for i in range(129)]
extrude('Porch_Cream_Gable', [(-.70,1.27),(.70,1.27)]+list(reversed(crest)), -1.16,-.98,cream,.018)
# Full-depth trim seals the cream backing along both sides and at the tips.
# Extend the green ends into the wood beam instead of leaving an exposed wedge.
beam=[(-.70,1.29),(0,1.37),(.70,1.29)]
extrude('Porch_Wood_Lower_Beam',
        [(x,z-.055) for x,z in beam]+[(x,z+.055) for x,z in reversed(beam)],
        -1.245,-.965,wood,.018)
outer,inner=[],[]
for x,z in crest:
    slope=-.60*math.pi/1.40*math.sin(math.pi*x/1.40)
    normal=Vector((-slope,1)).normalized()
    outer.append((x+.052*normal.x,z+.052*normal.y))
    inner.append((x-.052*normal.x,z-.052*normal.y))
extrude('Porch_Green_Curved_Edge', outer+list(reversed(inner)),
        -1.24,-.96,green,.012)
# Use the exact interior medallion geometry instead of a separate exterior sprout.
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'information-sprout-mark-v1'/'Information-sprout-wall-mark.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:
        obj.matrix_world=(Matrix.Translation((0,-1.185,1.63))
                          @ Matrix.Scale(.36,4) @ obj.matrix_world)

asset=list(bpy.context.scene.objects)
# All exterior timber, including the imported sign rim, shares the window frame.
# Keep the independent interior medallion asset's materials unchanged.
for obj in asset:
    if obj.type!='MESH':continue
    for slot in obj.material_slots:
        if slot.material and ('Wood' in slot.material.name or 'Honey' in slot.material.name):
            slot.material=wood
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1200
scene.render.resolution_y=1000
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
cam.data.ortho_scale=4.3
scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Model produced; user art review pending','reference':'output/meshy-buildings-v1/02-settlement-office.png','style':['home-single-eaves-v6','cipher-exterior-blender-v1'],'rear':'windowless','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')
