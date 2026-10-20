"""Compact home using the adopted brokerage's native blue/ivory architecture."""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
ivory = material('Home_Wall_Ivory', (.78, .735, .63))
cream = material('Home_Trim_Cream', (.86, .81, .70))
blue = material('Home_Roof_Blue', (.035, .115, .24))
edge = material('Home_Roof_Edge_Blue', (.025, .075, .145))
glass = material('Home_Window_Muted_Blue', (.10, .20, .29), .65)
wood = material('Home_Door_Warm_Wood', (.29, .135, .055))
wood_dark = material('Home_Door_Groove', (.18, .077, .028))
brass = material('Home_Door_Handle', (.55, .38, .15), .65)
cement = material('Home_Entrance_Warm_Cement', (.43, .41, .37), 1)

box('Home_Foundation', (2.20, 1.80, .12), (0, 0, .06), cream, .035)
front = box('Home_Facade', (2.10, .12, 1.12), (0, -.77, .68), ivory, .025)
box('Home_Back_NoWindows', (2.10, .12, 1.12), (0, .77, .68), ivory, .025)
for sign in [-1, 1]:
    box('Home_Left_Wall' if sign < 0 else 'Home_Right_Wall',
        (.12, 1.42, 1.12), (sign * .99, 0, .68), ivory, .025)
    box('Home_Side_Base', (.15, 1.52, .14), (sign * .99, 0, .19), cream, .012)
    box('Home_Front_Base', (.64, .15, .14), (sign * .72, -.78, .19), cream, .012)
box('Home_Back_Base', (2.10, .15, .14), (0, .78, .19), cream, .012)
for sx in [-1, 1]:
    for sy in [-1, 1]:
        box('Home_Corner_Trim', (.14, .14, 1.03), (sx * .99, sy * .77, .70), cream, .012)
        box('Home_Corner_Base_Block', (.19, .19, .18), (sx * .99, sy * .77, .21), cream, .012)

# Real arched opening, single independent wooden door and rounded cream surround.
bottom, radius, spring = .12, .29, .65
outline = [(x, z + bottom) for x, z in arch_outline(radius, spring)]
cutter = extrude('Home_Door_Cutter', outline, -1, -.55, ivory, 0)
bpy.context.view_layer.objects.active = front
cut = front.modifiers.new('Arched_Entry_Opening', 'BOOLEAN')
cut.operation = 'DIFFERENCE'
cut.object = cutter
bpy.ops.object.modifier_apply(modifier=cut.name)
bpy.data.objects.remove(cutter, do_unlink=True)
door = extrude('Home_Arched_Wood_Door', outline, -.843, -.795, wood, .007)
arch_ring('Home_Door_Frame', 0, bottom, radius, spring, .047, -.88, -.78, cream)
for x in [-.17, -.057, .057, .17]:
    stroke('Home_Door_Plank_Groove', [(x, -.853, .15), (x, -.853, .78)], .0025, wood_dark)
disk('Home_Door_Knob_Base', .19, -.861, .55, .024, .012, brass)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.018, location=(.19, -.883, .55))
knob = bpy.context.object
knob.name = 'Home_Door_Knob'
knob.data.materials.append(brass)
box('Home_Cement_Entry', (.79, .32, .075), (0, -.94, .0375), cement, .018)

for sign in [-1, 1]:
    x, base, r, s = sign * .70, .40, .175, .275
    extrude('Home_Front_Window_Glass', [(x + px, base + pz) for px, pz in arch_outline(r, s)],
            -.849, -.82, glass, .005)
    arch_ring('Home_Window_Frame', x, base, r, s, .04, -.88, -.80, cream)
    box('Home_Window_Sill', (.46, .13, .04), (x, -.86, base - .018), cream, .01)
    box('Home_Window_Mullion', (.02, .02, .37), (x, -.887, base + .20), cream, .004)
    box('Home_Window_Crossbar', (.345, .02, .02), (x, -.888, base + .24), cream, .004)

# Same clean curved eaves as the brokerage, without the clock/trading sign.
profile = []
for i in range(49):
    x = -1.23 + 2.46 * i / 48
    z = 1.25 + .67 * max(0, math.cos(abs(x) / 1.23 * math.pi / 2)) ** 1.18
    profile.append((x, z))
for name, ya, yb in [('Home_Front_Gable', -.825, -.72), ('Home_Back_Gable_NoWindows', .72, .825)]:
    gable = [(x, z - .075) for x, z in profile if abs(x) <= 1.05]
    extrude(name, [(-1.05, 1.20), (1.05, 1.20)] + list(reversed(gable)), ya, yb, ivory, .005)
box('Home_Front_Eave_Trim', (2.1, .045, .035), (0, -.849, 1.235), cream, .007)
box('Home_Back_Eave_Trim', (2.1, .045, .035), (0, .849, 1.235), cream, .007)
extrude('Home_Smooth_Curved_Roof', profile + [(x, z - .08) for x, z in reversed(profile)],
        -.95, .95, blue, .022)
for y in [-.965, .965]:
    stroke('Home_Curved_Fascia', [(x, y, z - .04) for x, z in profile], .03, edge)
stroke('Home_Roof_Ridge', [(0, -.98, 1.92), (0, .98, 1.92)], .027, blue)
# A small front attic window makes this a home instead of another brokerage.
disk('Home_Attic_Window_Rim', 0, -.849, 1.56, .135, .025, cream)
disk('Home_Attic_Window_Glass', 0, -.868, 1.56, .100, .015, glass)
box('Home_Attic_Window_Vertical', (.014, .015, .196), (0, -.88, 1.56), cream, .003)
box('Home_Attic_Window_Horizontal', (.196, .015, .014), (0, -.88, 1.56), cream, .003)

for obj in list(bpy.context.scene.objects):
    if obj.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
asset = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-native.glb'), export_format='GLB', use_selection=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.world = bpy.data.worlds.new('Home_Studio_World')
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
cam.data.ortho_scale = 3.3
scene.camera = cam
for name, location in [('front-right', (4, -6, 3.5)), ('front', (0, -7, 2.6)), ('rear', (4, 6, 3.5))]:
    cam.location = location
    cam.rotation_euler = (Vector((0, -.03, .96)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
# Preview support objects are marked separately; exported GLB contains only the house.
for obj in scene.objects:
    obj['preview_only'] = obj not in asset
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-native.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'style_reference': 'cipher-exterior-clock-v1/front-right.png',
    'style': 'Native smooth blue curved roof, ivory walls and cream rounded trim',
    'home_details': ['Single arched wood door', 'Two arched front windows', 'Round front attic window',
                     'Warm matte cement entrance', 'Windowless rear'],
    'game_width': 320, 'mesh_count': len(asset),
    'notes': 'Original HomeBuilding.glb and interior assets retained. Door is static, not animated.'
}, indent=2), encoding='utf-8')
