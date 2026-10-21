"""Seal tile undersides and doorway threshold while retaining v4 refinements."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import box

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-eaves-window-v4' / 'Home-refined.blend'))
wood = bpy.data.materials['Home_Honey_Wood']
stone = bpy.data.materials['Home_Beige_Stone']
added = []
# Backing overlaps fascia and tile underside, closing the eave's narrow reveal.
for sign in [-1, 1]:
    added.append(box('Home_Sealed_Tile_Underside', (.065, 1.98, .075),
                     (sign * 1.2125, 0, 1.2125), wood, .004))
# Extend below/behind the beveled door and jamb feet, inside the existing step width.
added.append(box('Home_Continuous_Door_Threshold', (.78, .22, .05),
                 (.43, -.82, .12), stone, .004))
for obj in added:
    obj['preview_only'] = False
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.context.view_layer.objects.active = added[-1]
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-sealed.glb'), export_format='GLB', use_selection=True)
scene = bpy.context.scene
cam = scene.camera
for name, offset, target, scale in [
    ('front-right', (4, -6, 2.4), (0, -.03, 1.10), 3.6),
    ('eaves-detail', (3, -4, 2.7), (1.17, -.94, 1.30), .70),
    ('threshold-detail', (1, -5, 1.8), (.43, -.84, .15), .95),
]:
    point = Vector(target)
    cam.location = point + Vector(offset)
    cam.rotation_euler = (point - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
cam.data.ortho_scale = 3.6
cam.location = (4, -6, 3.5)
cam.rotation_euler = (Vector((0, -.03, 1.10)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-sealed.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'changes': ['Tile underside backing overlaps continuous eaves',
                'Continuous threshold closes bottom and side-jamb gaps'],
    'retained': ['V4 continuous corners', 'Recessed front and side window bars',
                 'Original roof/wall/door colors', 'No masonry or canopy'],
    'objects_added': [o.name for o in added]
}, indent=2), encoding='utf-8')
