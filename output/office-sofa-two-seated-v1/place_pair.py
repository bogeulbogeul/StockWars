"""Anna and Somangi seated together on the two sofa cushions."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-sofa-no-pillows-v2'/'Office-sofa-no-pillows-preview.blend'))
placements=[]
for holder_name,source,names,action,pos in [
    ('Anna_Provisional_Chair_Fit','anna-meshy-short-vest-v5/Anna-meshy-short-vest.blend',
     ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest'],'Seated',(3.175,-.9575)),
    ('Somangi_Visitor_Seated_Preview','somangi-bench-sit-v2/somangi-bench-sit.blend',
     ['Somangi_Rig','Somangi_Body'],'Bench_Seated',(3.175,-1.8025))]:
    old=bpy.data.objects[holder_name]
    for obj in list(old.children_recursive)+[old]:bpy.data.objects.remove(obj,do_unlink=True)
    with bpy.data.libraries.load(str(ROOT.parent/source),link=False) as (data,target):
        target.objects=names;target.actions=[action]
    objects=[o for o in target.objects if o]
    for obj in objects:bpy.context.collection.objects.link(obj)
    rig=next(o for o in objects if o.type=='ARMATURE')
    rig.animation_data_create();rig.animation_data.action=target.actions[0]
    for track in rig.animation_data.nla_tracks:track.mute=True
    holder=bpy.data.objects.new(holder_name+'_Sofa',None);bpy.context.collection.objects.link(holder)
    for obj in objects:
        if obj.parent not in objects:obj.parent=holder
    # Keep the same provisional character scale as the office seating previews.
    holder.scale=(.65,)*3;holder.rotation_euler.z=-math.pi/2
    bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
    body=next(o for o in objects if o.name.startswith('Eating_Torso')) if action=='Seated' else next(o for o in objects if o.type=='MESH')
    def vertices(obj):
        ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        points=[ev.matrix_world@v.co for v in mesh.vertices];ev.to_mesh_clear();return points
    points=vertices(body)
    if action=='Bench_Seated':
        info=json.loads((ROOT.parent/'somangi-bench-sit-v2'/'seat.json').read_text())
        hip=[points[i] for i in info['butt_vertex_ids']]
    else:hip=points
    cx=(min(p.x for p in hip)+max(p.x for p in hip))/2
    cy=(min(p.y for p in hip)+max(p.y for p in hip))/2
    holder.location=(pos[0]-cx,pos[1]-cy,.633-min(p.z for p in hip))
    bpy.context.view_layer.update()
    points=[p for o in objects if o.type=='MESH' for p in vertices(o)]
    placements.append({'character':holder_name,'scale':.65,'seat_center':list(pos),
        'bounds':{'min':[min(p[i] for p in points) for i in range(3)],
                  'max':[max(p[i] for p in points) for i in range(3)]}})
scene=bpy.context.scene;cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=3.8
cam.location=(.35,-4.1,2.7)
cam.rotation_euler=(Vector((2.65,-1.38,.95))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'sofa-two-seated.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-sofa-two-seated-preview.blend'))
(ROOT/'fit-report.json').write_text(json.dumps({'placements':placements,
    'seat_surface':.632,'contact_target':.633,
    'status':'Static seated preview; floor/bench poses reused, full collisions and transitions unverified',
    'game_changed':False},indent=2),encoding='utf-8')
