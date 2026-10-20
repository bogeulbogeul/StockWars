"""Place a matching cabinet on each side of Anna's chair."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
source=ROOT.parent/'information-drawer-cabinet-v1'
bpy.ops.wm.open_mainfile(filepath=str(source/'Office-cabinet-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(source/'Information-drawer-cabinet.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((-1.30,2.30,.022))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=4.8
cam.location=(2.6,-4.5,3.8)
cam.rotation_euler=(Vector((0,1.05,.80))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'desk-preview.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-two-cabinets-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'cabinet_source':'information-drawer-cabinet-v1/Information-drawer-cabinet.glb',
    'positions':[[-1.30,2.30,.022],[1.30,2.30,.022]],
    'chair_side_clearance_each':.455,'back_wainscot_clearance_each':.15,
    'anna_source':'anna-meshy-short-vest-v5',
    'status':'Two-cabinet placement preview; game not changed'
},indent=2),encoding='utf-8')
