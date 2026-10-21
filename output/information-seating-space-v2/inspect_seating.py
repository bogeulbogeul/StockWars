"""Measure furniture clearances and inspect the available Anna animation clips."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'anna-motion-v4'/'Anna-motion.glb'))
clips=[a.name for a in bpy.data.actions]
bones={o.name:[b.name for b in o.data.bones] for o in bpy.context.scene.objects if o.type=='ARMATURE'}
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'Room-seating-space.blend'))

def bounds(objects):
    corners=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
    return {'min':[min(v[i] for v in corners) for i in range(3)],
            'max':[max(v[i] for v in corners) for i in range(3)]}

def meshes(prefix):
    return [o for o in bpy.context.scene.objects if o.type=='MESH' and
            any(m and m.name.startswith(prefix) for m in o.data.materials)]

chair=bounds(meshes('Anna_Chair_'))
desk=bounds(meshes('Desk_'))
cushion=bounds([o for o in meshes('Anna_Chair_') if o.name.startswith('Seat_Sage_Cushion')])
counter=bounds([o for o in meshes('Desk_') if o.name.startswith('Rounded_Wood_Countertop')])
gap=chair['min'][1]-counter['max'][1]
wall_gap=2.8-chair['max'][1]
underseat=counter['min'][2]-cushion['max'][2]
assert gap>.4 and wall_gap>.15 and underseat>.25
scene=bpy.context.scene
bpy.context.view_layer.update()
# Check a straight leg-space approach through the desk's open rear bay.
ray_origin=Vector((0,1.80,.72))
hit,loc,normal,index,obj,matrix=scene.ray_cast(bpy.context.evaluated_depsgraph_get(),ray_origin,Vector((0,-1,0)),distance=1.6)
assert hit and loc.y<.75, (obj.name if obj else None, list(loc))
report={'furniture_clearance':'PASS',
    'units':'temporary modeling units; not meters',
    'chair_bounds':chair,'desk_bounds':desk,
    'chair_front_to_counter_back':round(gap,4),
    'chair_back_to_wainscot':round(wall_gap,4),
    'seat_surface_to_counter_underside':round(underseat,4),
    'knee_bay_width':1.45,'chair_width':round(chair['max'][0]-chair['min'][0],4),
    'knee_space_ray_first_hit':{'object':obj.name,'position':list(loc)},
    'available_anna_candidate_clips':clips,'available_anna_candidate_bones':bones,
    'anna_seated_body_fit':'UNVERIFIED: no adopted seated pose or locked character scale',
    'game_integration':'not performed'}
(ROOT/'seating-inspection.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=3.4
scene.render.resolution_x=1200;scene.render.resolution_y=900
cam.location=(3.6,1.5,2.9)
cam.rotation_euler=(Vector((0,1.5,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'seating-side-check.png')
bpy.ops.render.render(write_still=True)
print(json.dumps(report))
