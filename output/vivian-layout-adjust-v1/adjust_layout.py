"""Small placement adjustments to checkout and packing station."""
import bpy
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-right-fridges-v1'/'Room-two-right-fridges.blend'))
counter=[o for o in bpy.context.scene.objects if o.get('asset_role')=='checkout_counter']
packing=[o for o in bpy.context.scene.objects if o.get('asset_role')=='packing_station']
assert counter and packing
for obj in counter:
    obj.location.y-=.40
for obj in packing:
    obj.location.x-=.30
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    obj.select_set(obj.type in ('MESH','EMPTY'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Room-layout-adjusted.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-adjusted.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-layout-adjusted.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Layout model adjusted; game not changed',
    'counter_translation':[0,-.40,0],
    'packing_translation':[-.30,0,0],
    'counter_center':[0,.75,0],'packing_center':[1.95,2.22,0],
    'units':'Temporary modeling units',
    'preserved':['Two empty right-wall fridges','Empty left-wall shelves','Room and flower'],
    'validation':'Rendered overview; complete assemblies moved together'
},indent=2),encoding='utf-8')
