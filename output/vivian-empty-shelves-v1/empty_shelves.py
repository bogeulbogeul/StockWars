"""Remove merchandise only, preserving the two installed shelving units."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-shelves-layout-v1'/'Room-counter-flower-shelves.blend'))
goods=[o for o in bpy.context.scene.objects if o.name.startswith('Goods_')]
removed=[o.name for o in goods]
assert goods, 'Expected merchandise to remove'
for obj in goods:
    bpy.data.objects.remove(obj,do_unlink=True)
assert not any(o.name.startswith('Goods_') for o in bpy.context.scene.objects)
assert len([o for o in bpy.context.scene.objects if o.name.startswith('Shelf_Unit_')])==2

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Room-empty-shelves.glb',[o for o in bpy.context.scene.objects if o.type in ('MESH','EMPTY')])
export('Vivian-empty-shelves.glb',[o for o in bpy.context.scene.objects
    if o.name.startswith('Shelf_') or o.get('asset_role')=='stocked_merchandise_shelf'])
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-empty-shelves.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-empty-shelves.blend'))
cam=scene.camera
cam.location=(1,-5,3.5)
cam.rotation_euler=(Vector((-3.3,-.3,1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=45
scene.render.filepath=str(ROOT/'shelves-detail.png')
bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Merchandise removed from room model; game not changed',
    'removed_objects':len(removed),'remaining_shelf_units':2,
    'preserved':['Shelf geometry and positions','Counter','Wall flower','Room shell'],
    'validation':'No Goods_ objects remain; exactly two shelf units preserved'
},indent=2),encoding='utf-8')
