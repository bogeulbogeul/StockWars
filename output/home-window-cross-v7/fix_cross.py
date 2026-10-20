"""Remove coplanar overlap at the round door window's crossbar intersection."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-single-eaves-v6' / 'Home-single-eaves.blend'))
horizontal = bpy.data.objects['Home_Door_Glass_Cross_H']
vertical = bpy.data.objects['Home_Door_Glass_Cross_V']
# Front faces previously occupied exactly the same plane, producing a dark dot.
horizontal.location.y = vertical.location.y - .0015
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-window-clean.glb'), export_format='GLB', use_selection=True)
scene, cam = bpy.context.scene, bpy.context.scene.camera
for name, target, offset, scale in [
    ('window-detail', (.43, -.89, .77), (1, -5, 1.2), .42),
    ('front-right', (0, -.03, 1.10), (4, -6, 2.4), 3.6),
]:
    point = Vector(target)
    cam.location = point + Vector(offset)
    cam.rotation_euler = (point - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-window-clean.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'fix': 'Separated coplanar front surfaces of door-window crossbars by 0.0015 source units',
    'preserved': 'Crossbar shape, color, round glass, all other exterior geometry'
}, indent=2), encoding='utf-8')
