"""Move the empty fridge to the right wall and add a matching second unit."""
import bpy
import math
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-packing-table-v1'/'Room-with-packing-table.blend'))
parts=[o for o in bpy.context.scene.objects if o.get('asset_role')=='empty_drinks_fridge']
assert parts
old_x,old_y=-2.05,2.28
# Rotate the doors from -Y toward -X so both units open into the room.
for index,cy in enumerate([.80,-.95]):
    pivot=bpy.data.objects.new('Right_Wall_Fridge_'+str(index+1),None)
    bpy.context.collection.objects.link(pivot)
    for original in parts:
        if index==0:
            obj=original
            obj.location.x-=old_x
            obj.location.y-=old_y
        else:
            obj=original.copy()
            obj.data=original.data.copy()
            bpy.context.collection.objects.link(obj)
        obj.parent=pivot
    pivot.rotation_euler.z=-math.pi/2
    pivot.location=(3.48,cy,0)
assert len([o for o in bpy.context.scene.objects if o.get('asset_role')=='empty_drinks_fridge'])==2*len(parts)
assert not any(o.name.startswith('Goods_') for o in bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    obj.select_set(obj.type in ('MESH','EMPTY'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Room-two-right-fridges.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-two-fridges.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-two-right-fridges.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Existing empty fridge moved; second empty fridge added; game not changed',
    'fridge_count':2,'placement':'Right wall, both doors face room center',
    'centers':[[3.48,.80,0],[3.48,-.95,0]],
    'goods':0,'preserved':['Packing table','Counter','Wall flower','Empty left shelves'],
    'validation':'Two complete fridge assemblies; no Goods_ objects; rendered overview'
},indent=2),encoding='utf-8')
