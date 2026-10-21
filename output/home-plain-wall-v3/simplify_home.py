"""Remove masonry details and door canopy from the adopted red-roof cottage."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import box

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-original-style-v2' / 'Home-original-clean.blend'))
prefixes = ('Home_Side_Foundation_Stone', 'Home_Back_Foundation_Stone',
            'Home_Front_Foundation_Stone', 'Home_Corner_Stone',
            'Home_Curved_Door_Canopy', 'Home_Canopy_Bracket',
            'Home_Chimney_Stone_Course', 'Home_Door_Stone_Jamb', 'Home_Door_Jamb_Foot')
removed = []
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(prefixes):
        removed.append(obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)
chimney = box('Home_Smooth_Chimney', (.29, .30, .463), (.66, .35, 1.854),
              bpy.data.materials['Home_Beige_Stone'], .012)
chimney['preview_only'] = False
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
assert not any(o.name.startswith(prefixes) for o in asset)
assert any(o.name == 'Home_Arched_Wood_Door' for o in asset)
assert any(o.name == 'Home_Curved_Roof_Base' for o in asset)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.context.view_layer.objects.active = chimney
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-plain-wall.glb'), export_format='GLB', use_selection=True)
scene = bpy.context.scene
cam = scene.camera
for name, location in [('front-right', (4, -6, 3.5)), ('rear', (4, 6, 3.5))]:
    cam.location = location
    cam.rotation_euler = (Vector((0, -.03, 1.10)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-plain-wall.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'removed': removed, 'chimney': 'Single smooth body without brick courses',
    'retained': ['Red tiled roof', 'Cream walls', 'Round-glazed wood door', 'Windows', 'Steps'],
    'validation': 'All masonry-block and door-canopy objects absent from exported asset'
}, indent=2), encoding='utf-8')
