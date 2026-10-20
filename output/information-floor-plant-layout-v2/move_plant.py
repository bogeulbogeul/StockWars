"""Move the large planter outside the right cabinet, preserving the exit aisle."""
import bpy
import json
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-floor-plant-v1'/'Office-floor-plant-preview.blend'))
plant=bpy.data.objects['Information_Floor_Plant']
plant.matrix_world=Matrix.Translation((0,2.0,0))@plant.matrix_world
bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in plant.children_recursive if o.type=='MESH' for c in o.bound_box]
lo=[min(p[i] for p in points) for i in range(3)]
hi=[max(p[i] for p in points) for i in range(3)]
# Cabinet outer edge is x=2.60; rear molding inner face y=2.80.
assert lo[0]>2.60 and hi[0]<3.76 and hi[1]<2.80,(lo,hi)
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=2.5;cam.location=(1.0,-.6,2.7)
cam.rotation_euler=(Vector((2.7,2.3,.85))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1100;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'cabinet-plant.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-plant-by-cabinet-preview.blend'))
(ROOT/'placement.json').write_text(json.dumps({'position':[3.24,2.30,.022],
    'bounds':{'min':lo,'max':hi},'cabinet_gap':lo[0]-2.60,
    'rear_molding_gap':2.80-hi[1],
    'walkway':'plant is outside the cabinet, away from chair-side exit path',
    'game_changed':False},indent=2),encoding='utf-8')
