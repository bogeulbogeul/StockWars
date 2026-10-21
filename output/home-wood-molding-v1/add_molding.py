"""Thin light-wood skirting and crown trim, parented to each rotating cutaway wall."""
import bpy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import box, material

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-ivory-wallpaper-v1' / 'Room-ivory-wallpaper.blend'))
p = json.loads((ROOT.parent / 'room-clean-v2' / 'parameters.json').read_text())
x0, x1 = p['x_min'] + p['wall_thickness'], p['x_max'] - p['wall_thickness']
y0, y1 = -p['z_max'] + p['wall_thickness'], -p['z_min'] - p['wall_thickness']
floor, top = p['bottom'] + p['floor_thickness'], p['top']
wood = material('Home_Light_Wood_Molding', (.56, .38, .20), .83)
depth = .014
trims = []

def trim(name, wall, size, position):
    obj = box(name, size, position, wood, .002)
    transform = obj.matrix_world.copy()
    obj.parent = bpy.data.objects[wall]
    obj.matrix_world = transform
    obj['purpose'] = 'Decorative trim; inherits wall camera visibility'
    trims.append(obj)

for label, height, z in [('Skirting', .035, floor + .0175), ('Crown', .024, top - .012)]:
    # Side strips meet the inset back/front strips at flush butt joints.
    trim('Left_' + label, 'Wall_Left', (depth, y1 - y0, height), (x0 + depth / 2, (y0 + y1) / 2, z))
    trim('Right_' + label, 'Wall_Right', (depth, y1 - y0, height), (x1 - depth / 2, (y0 + y1) / 2, z))
    trim('Back_' + label, 'Wall_Back', (x1 - x0 - 2 * depth, depth, height),
         ((x0 + x1) / 2, y1 - depth / 2, z))
    segments = [(x0 + depth, p['door_left']), (p['door_right'], x1 - depth)] if label == 'Skirting' else [(x0 + depth, x1 - depth)]
    for i, (left, right) in enumerate(segments):
        trim('Front_' + label + '_' + str(i), 'Wall_Front', (right - left, depth, height),
             ((left + right) / 2, y0 + depth / 2, z))
assert len(trims) == 9
assert all(obj.parent and obj.parent.name.startswith('Wall_') for obj in trims)
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-wood-molding.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-wood-molding.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'trim_count': len(trims), 'skirting_height': .035, 'crown_height': .024,
    'trim_depth': depth, 'material': 'Light warm matte wood',
    'wall_children': {obj.name: obj.parent.name for obj in trims},
    'preserved': ['Ivory wallpaper', 'Office plank floor', 'Cement entry fade', 'Room size and walking height'],
    'doorway': 'Skirting split around existing opening'
}, indent=2), encoding='utf-8')
