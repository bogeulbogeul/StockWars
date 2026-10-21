"""Place the existing bench seated pose on the visitor stool, facing Anna."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
source=ROOT.parent/'somangi-bench-sit-v2'
info=json.loads((source/'seat.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'somangi-visitor-stool-v1'/'Room-visitor-stool-preview.blend'))
with bpy.data.libraries.load(str(source/'somangi-bench-sit.blend'),link=False) as (data,target):
    target.objects=['Somangi_Rig','Somangi_Body']
    target.actions=['Bench_Seated']
objects=[o for o in target.objects if o]
for obj in objects:bpy.context.collection.objects.link(obj)
rig=next(o for o in objects if o.type=='ARMATURE')
body=next(o for o in objects if o.type=='MESH')
rig.animation_data_create();rig.animation_data.action=target.actions[0]
for track in rig.animation_data.nla_tracks:track.mute=True
holder=bpy.data.objects.new('Somangi_Visitor_Seated_Preview',None)
bpy.context.collection.objects.link(holder)
for obj in objects:
    if obj.parent not in objects:obj.parent=holder
holder.scale=(.65,)*3;holder.rotation_euler.z=math.pi
scene=bpy.context.scene;scene.frame_set(1);bpy.context.view_layer.update()

def points():
    obj=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=obj.to_mesh()
    result=[obj.matrix_world@v.co for v in mesh.vertices];obj.to_mesh_clear()
    return result

verts=points();ids=info['butt_vertex_ids'];hip=[verts[i] for i in ids]
cx=(min(p.x for p in hip)+max(p.x for p in hip))/2
cy=(min(p.y for p in hip)+max(p.y for p in hip))/2
# Contact is derived from the body-weighted pelvis surface, not the feet.
holder.location=(-cx,-.40-cy,.512-min(p.z for p in hip)+.001)
bpy.context.view_layer.update();verts=points();hip=[verts[i] for i in ids]
near_seat=[p for p in verts if p.z<.55]
contact=min(p.z for p in hip)-.512
front=max(p.y for p in verts)
assert abs(contact-.001)<1e-5
assert front<.41,front
report={'source':'somangi-bench-sit-v2','clip':'Bench_Seated','facing':'Anna / Blender +Y',
    'scale':.65,'scale_status':'provisional preview, matching Anna preview',
    'stool_surface_z':.512,'pelvis_contact_gap':contact,
    'character_to_desk_front_y_gap':.41-front,
    'lowest_character_z':min(p.z for p in verts),
    'floor_z':.022,'validation':'Seated hold only; transition and full surface collisions unverified',
    'source_and_game_changed':False}
(ROOT/'fit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=4.3
scene.render.resolution_x=1400;scene.render.resolution_y=1100
for name,loc,targetpoint in [('desk-preview',(3.5,-4,3.5),(0,.65,.85)),
                            ('side',(4,1,2.4),(0,.7,.8))]:
    cam.location=loc;cam.rotation_euler=(Vector(targetpoint)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Somangi-stool-fit-preview.blend'))
print(json.dumps(report))
