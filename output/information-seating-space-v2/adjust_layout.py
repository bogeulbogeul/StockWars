"""Give Anna a visible seated-body gap without changing furniture geometry."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-desk-props-v1'/'Room-desk-props-preview.blend'))
chair=[o for o in bpy.context.scene.objects if o.type=='MESH' and
       any(m and m.name.startswith('Anna_Chair_') for m in o.data.materials)]
assert len(chair)==13, len(chair)
for obj in chair:
    world=obj.matrix_world.copy();world.translation.y+=.38;obj.matrix_world=world
for obj in bpy.context.scene.objects:
    if obj.name.startswith('Anna_Seat_Anchor'):
        world=obj.matrix_world.copy();world.translation.y+=.38;obj.matrix_world=world
bpy.context.view_layer.update()
chair_corners=[o.matrix_world@Vector(c) for o in chair for c in o.bound_box]
front=min(c.y for c in chair_corners)
back=max(c.y for c in chair_corners)
desk_back=.92+1.02/2
gap=front-desk_back
assert gap>.40, gap
assert back<2.80, back
scene=bpy.context.scene
cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'room-preview.png')
bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=3.65
cam.location=(3,-4,3.6)
cam.rotation_euler=(Vector((0,1.1,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'desk-detail.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-seating-space.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'chair_moved_back':.38,'chair_center_y':2.23,
    'chair_front_to_counter_back_gap':round(gap,4),
    'chair_back_to_wainscot_clearance':round(2.8-back,4),
    'chair_meshes':len(chair),'desk_and_props':'unchanged',
    'status':'Layout preview; Anna seated-body fit and game integration pending'
},indent=2),encoding='utf-8')
