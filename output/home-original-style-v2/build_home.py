"""Preserve the original red-roof cottage design with clean native geometry."""
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
wall = material('Home_Cream_Plaster', (.84, .75, .56))
stone = material('Home_Beige_Stone', (.59, .48, .33))
red = material('Home_Terracotta_Tiles', (.60, .075, .025))
under = material('Home_Roof_Underlay', (.36, .07, .025))
wood = material('Home_Honey_Wood', (.33, .18, .062))
groove = material('Home_Wood_Grooves', (.23, .12, .04))
glass = material('Home_Blue_Gray_Glass', (.12, .20, .26), .75)
gold = material('Home_Brass_Handle', (.65, .39, .06), .65)
cap = material('Home_Chimney_Dark_Cap', (.12, .075, .05))

box('Home_Foundation', (2.20, 1.80, .12), (0, 0, .06), stone, .035)
front = box('Home_Facade', (2.10, .12, 1.12), (0, -.77, .68), wall, .02)
box('Home_Back_NoWindows', (2.10, .12, 1.12), (0, .77, .68), wall, .02)
for sign in [-1, 1]:
    box('Home_Left_Wall' if sign < 0 else 'Home_Right_Wall',
        (.12, 1.42, 1.12), (sign * .99, 0, .68), wall, .02)
    for j in range(5):
        box('Home_Side_Foundation_Stone', (.17, .30, .16), (sign * .99, -.61 + j * .305, .20), stone, .012)
for j in range(6):
    box('Home_Back_Foundation_Stone', (.34, .17, .16), (-.875 + j * .35, .78, .20), stone, .012)
for x in [-.87, -.53, -.19, .91]:
    box('Home_Front_Foundation_Stone', (.32, .17, .16), (x, -.78, .20), stone, .012)
for sx in [-1, 1]:
    for sy in [-1, 1]:
        for i in range(4):
            box('Home_Corner_Stone', (.18, .18, .215), (sx * .99, sy * .77, .26 + i * .23), stone, .018)

door_x = .43
bottom, radius, spring = .12, .27, .64
outline = [(door_x + x, bottom + z) for x, z in arch_outline(radius, spring)]
cutter = extrude('Home_Entry_Cutter', outline, -1, -.55, wall, 0)
bpy.context.view_layer.objects.active = front
cut = front.modifiers.new('True_Arched_Doorway', 'BOOLEAN')
cut.operation = 'DIFFERENCE'
cut.object = cutter
bpy.ops.object.modifier_apply(modifier=cut.name)
bpy.data.objects.remove(cutter, do_unlink=True)
extrude('Home_Arched_Wood_Door', outline, -.85, -.79, wood, .008)
arch_ring('Home_Wood_Door_Frame', door_x, bottom, radius, spring, .047, -.89, -.78, wood)
for sign in [-1, 1]:
    box('Home_Door_Stone_Jamb', (.075, .14, .56), (door_x + sign * .31, -.84, .42), stone, .012)
    box('Home_Door_Jamb_Foot', (.11, .17, .15), (door_x + sign * .31, -.85, .195), stone, .012)
for dx in [-.17, -.085, 0, .085, .17]:
    stroke('Home_Door_Plank_Groove', [(door_x + dx, -.859, .15), (door_x + dx, -.859, .61)], .002, groove)
disk('Home_Door_Round_Window_Rim', door_x, -.87, .77, .137, .024, wood)
disk('Home_Door_Round_Window_Glass', door_x, -.888, .77, .108, .012, glass)
box('Home_Door_Glass_Cross_V', (.014, .014, .212), (door_x, -.90, .77), wood, .003)
box('Home_Door_Glass_Cross_H', (.212, .014, .014), (door_x, -.90, .77), wood, .003)
disk('Home_Door_Knob_Base', door_x - .18, -.872, .48, .023, .014, gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.023,
                                   location=(door_x - .18, -.897, .48))
bpy.context.object.name = 'Home_Door_Knob'
bpy.context.object.data.materials.append(gold)
box('Home_Entry_Upper_Step', (.78, .26, .12), (door_x, -.94, .06), stone, .02)
box('Home_Entry_Lower_Step', (.86, .24, .055), (door_x, -1.10, .0275), stone, .018)

def window(name, x, base, r, s, side=False):
    before = set(bpy.context.scene.objects)
    extrude(name + '_Glass', [(x + px, base + pz) for px, pz in arch_outline(r, s)], -.85, -.82, glass, .005)
    arch_ring(name + '_Wood_Frame', x, base, r, s, .025, -.88, -.81, wood)
    arch_ring(name + '_Stone_Arch', x, base, r + .027, s, .055, -.89, -.79, stone)
    box(name + '_Sill', (r * 2 + .20, .14, .07), (x, -.87, base - .03), stone, .014)
    box(name + '_Cross_V', (.022, .02, s + r - .025), (x, -.903, base + (s + r) / 2), wood, .003)
    box(name + '_Cross_H', (r * 2, .02, .022), (x, -.904, base + s * .75), wood, .003)
    if side:
        pivot = bpy.data.objects.new(name + '_Pivot', None)
        bpy.context.collection.objects.link(pivot)
        for obj in set(bpy.context.scene.objects) - before - {pivot}:
            obj.parent = pivot
        pivot.rotation_euler.z = math.pi / 2
        pivot.location.x = .23

window('Home_Front_Window', -.54, .41, .225, .32)
window('Home_Right_Window', .05, .42, .17, .27, True)

def roof_height(x):
    return 1.25 + .67 * max(0, math.cos(abs(x) / 1.23 * math.pi / 2)) ** 1.18

profile = [(-1.23 + 2.46 * i / 48, roof_height(-1.23 + 2.46 * i / 48)) for i in range(49)]
for name, ya, yb in [('Home_Front_Gable', -.825, -.72), ('Home_Back_Gable_NoWindows', .72, .825)]:
    top = [(x, z - .075) for x, z in profile if abs(x) <= 1.05]
    extrude(name, [(-1.05, 1.20), (1.05, 1.20)] + list(reversed(top)), ya, yb, wall, .005)
extrude('Home_Curved_Roof_Base', profile + [(x, z - .09) for x, z in reversed(profile)], -.96, .96, under, .015)
for y in [-.974, .974]:
    stroke('Home_Wood_Eaves', [(x, y, z - .08) for x, z in profile], .047, wood)
for x in [-1.23, 1.23]:
    stroke('Home_Side_Wood_Eaves', [(x, -.99, 1.225), (x, .99, 1.225)], .038, wood)
# Broad, ordered native tiles retain the red tiled silhouette without noisy texture.
for i in range(12):
    xa, xb = -1.23 + i * .205, -1.23 + (i + 1) * .205
    curve = [(xa + (xb - xa) * k / 4, roof_height(xa + (xb - xa) * k / 4) + .025) for k in range(5)]
    contour = curve + [(x, z - .065) for x, z in reversed(curve)]
    for j in range(8):
        ya = -.98 + j * .245
        extrude('Home_Red_Roof_Tile', contour, ya, ya + .237, red, .012)
for j in range(8):
    box('Home_Red_Ridge_Tile', (.18, .237, .085), (0, -.86 + j * .245, 1.958), red, .027)
# Original curved wooden canopy over the offset front door.
canopy = [(door_x - .39 + .78 * i / 16, 1.10 + .065 * math.sin(math.pi * i / 16)) for i in range(17)]
extrude('Home_Curved_Door_Canopy', canopy + [(x, z - .075) for x, z in reversed(canopy)], -1.03, -.78, wood, .012)
for sign in [-1, 1]:
    box('Home_Canopy_Bracket', (.055, .16, .14), (door_x + sign * .30, -.87, 1.03), wood, .008)
# Beige chimney, subtle brick courses and dark open-sided rain cap.
for i in range(4):
    box('Home_Chimney_Stone_Course', (.29, .30, .115), (.66, .35, 1.68 + i * .116), stone, .009)
box('Home_Chimney_Collar', (.35, .36, .07), (.66, .35, 2.115), stone, .01)
for sx in [-1, 1]:
    for sy in [-1, 1]:
        box('Home_Chimney_Cap_Support', (.045, .045, .09), (.66 + sx * .115, .35 + sy * .12, 2.185), cap, .004)
box('Home_Chimney_Dark_Cap', (.38, .39, .075), (.66, .35, 2.2675), cap, .012)

for obj in list(bpy.context.scene.objects):
    if obj.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
asset = list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-original-clean.glb'), export_format='GLB', use_selection=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.world = bpy.data.worlds.new('Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.80, .84, .90, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .65
scene.render.resolution_x = 1200
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
box('Preview_Ground', (200, 200, .01), (0, 0, -.015), material('Preview_Gray', (.72, .74, .77)), 0)
for location, power, size in [((-3, -4, 6), 350, 5), ((4, 1, 5), 200, 4)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    lamp = bpy.context.object
    lamp.data.energy = power
    lamp.data.size = size
    lamp.rotation_euler = (Vector((0, 0, 1)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.6
scene.camera = cam
for name, location in [('front-right', (4, -6, 3.5)), ('front', (0, -7, 2.6)), ('rear', (4, 6, 3.5))]:
    cam.location = location
    cam.rotation_euler = (Vector((0, -.03, 1.10)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
for obj in scene.objects:
    obj['preview_only'] = obj not in asset
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-original-clean.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'design_reference': 'meshy-buildings-v1/01-home.png and original HomeBuilding.glb',
    'style_only_reference': 'Clean matte native geometry and softened edges of brokerage',
    'retained': ['Red tiles', 'Cream plaster', 'Beige stone', 'Chimney', 'Left front window',
                 'Right wooden door with round glazing', 'Side window', 'Wood canopy', 'Two stone steps'],
    'rear': 'Windowless per current art guide', 'door_local_x': door_x,
    'status': 'Replaces blue-roof reinterpretation; original source preserved'
}, indent=2), encoding='utf-8')
