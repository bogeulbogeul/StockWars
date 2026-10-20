"""Remove only decorative throw pillows, preserving seat and back upholstery."""
import bpy
from pathlib import Path
from mathutils import Vector
import json

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-coffee-table-v1'/'Office-waiting-corner-preview.blend'))
removed=[]
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Gingham_Pillow','Cream_Pillow')):
        removed.append(obj.name);bpy.data.objects.remove(obj,do_unlink=True)
assert len(removed)==2,removed
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'waiting-corner.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-sofa-no-pillows-preview.blend'))
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-waiting-sofa-v1'/'Waiting-sage-sofa.blend'))
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Gingham_Pillow','Cream_Pillow')):bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
root=bpy.data.objects['Information_Waiting_Sofa'];root.select_set(True)
for obj in root.children_recursive:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Waiting-sage-sofa-no-pillows.glb'),export_format='GLB',use_selection=True)
bpy.context.scene.render.filepath=str(ROOT/'sofa.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Waiting-sage-sofa-no-pillows.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'removed':'two decorative throw pillows',
    'seat_and_back_cushions':'preserved','table_gap':.925,
    'status':'Updated sofa and waiting corner; game unchanged'},indent=2),encoding='utf-8')
