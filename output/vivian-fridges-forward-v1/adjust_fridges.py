"""Shift both right-wall fridges toward the entrance opposite the shelves."""
import bpy
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-layout-adjust-v1'/'Room-layout-adjusted.blend'))
units=[o for o in bpy.context.scene.objects if o.name.startswith('Right_Wall_Fridge_')]
assert len(units)==2
for obj in units:
    obj.location.y-=.50
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    obj.select_set(obj.type in ('MESH','EMPTY'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Room-fridges-forward.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-fridges-forward.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-fridges-forward.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Both fridge assemblies moved forward; game not changed',
    'translation':[0,-.50,0],
    'centers':[[3.48,.30,0],[3.48,-1.45,0]],
    'placement':'Right wall opposite left shelves; doors face center aisle',
    'units':'Temporary modeling units',
    'validation':'Both parent assemblies translated together; rendered overview'
},indent=2),encoding='utf-8')
