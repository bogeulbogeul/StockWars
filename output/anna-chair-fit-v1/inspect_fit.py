"""Provisional chair fit of the supplied floor-seated Anna, without editing source."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
source=ROOT.parent/'anna-meshy-short-vest-v5'/'Anna-meshy-short-vest.blend'
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-seating-space-v2'/'Room-seating-space.blend'))
with bpy.data.libraries.load(str(source),link=False) as (data,target):
    target.objects=[n for n in data.objects if n in ['Somangi_Rig','Somangi_Body','Eating_Torso',
        'Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']]
    target.actions=['Seated']
objects=[o for o in target.objects if o]
for obj in objects:bpy.context.collection.objects.link(obj)
rig=next(o for o in objects if o.type=='ARMATURE')
rig.animation_data_create();rig.animation_data.action=target.actions[0]
for track in rig.animation_data.nla_tracks:track.mute=True
scene=bpy.context.scene;scene.frame_set(1)
holder=bpy.data.objects.new('Anna_Provisional_Chair_Fit',None)
bpy.context.collection.objects.link(holder)
for obj in objects:
    if obj.parent not in objects:obj.parent=holder
holder.scale=(.65,)*3
bpy.context.view_layer.update()
torso=next(o for o in objects if o.name.startswith('Eating_Torso'))
body=next(o for o in objects if o.name.startswith('Somangi_Body'))

def vertices(obj):
    ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    points=[ev.matrix_world@v.co for v in mesh.vertices];ev.to_mesh_clear()
    return points

points=vertices(torso)
holder.location=(0,2.20-(min(v.y for v in points)+max(v.y for v in points))/2,
                 .587-min(v.z for v in points))
bpy.context.view_layer.update()
points=vertices(body)
foot_low=min(v.z for v in points)
torso_points=vertices(torso)
all_points=[v for o in objects if o.type=='MESH' for v in vertices(o)]
report={'source':'anna-meshy-short-vest-v5/Anna-meshy-short-vest.blend','clip':'Seated',
    'source_motion_type':'floor sitting, not chair sitting',
    'character_scale':.65,'scale_status':'provisional; not adopted',
    'torso_bottom':min(v.z for v in torso_points),'seat_surface':.587,
    'lowest_body_point':foot_low,'room_floor':.022,
    'body_floor_clearance':foot_low-.022,
    'frontmost_character_y':min(v.y for v in all_points),
    'result':'REQUIRES_CHAIR_POSE: floor-sitting leg translations remain; foot support unverified',
    'source_and_game_changed':False}
(ROOT/'fit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=3.5
scene.render.resolution_x=1200;scene.render.resolution_y=1000
for name,loc,targetpoint in [('front',(3,-4,3.4),(0,1.35,.95)),
                            ('side',(3.5,1.5,2.0),(0,1.6,.9))]:
    cam.location=loc
    cam.rotation_euler=(Vector(targetpoint)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Anna-chair-fit-preview.blend'))
print(json.dumps(report))
