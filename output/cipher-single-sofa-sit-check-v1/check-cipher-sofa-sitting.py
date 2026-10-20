import bpy
import json
import math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-single-sofa-sit-check-v1';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-single-sofa-v1/Cipher-single-sofa.blend'))
source=root/'output/somangi-bench-sit-v2'
with bpy.data.libraries.load(str(source/'somangi-bench-sit.blend'),link=False) as (data,target):
    target.objects=['Somangi_Rig','Somangi_Body'];target.actions=['Bench_Sit_Demo']
objects=[o for o in target.objects if o]
for obj in objects:bpy.context.collection.objects.link(obj)
rig=next(o for o in objects if o.type=='ARMATURE');body=next(o for o in objects if o.type=='MESH')
rig.animation_data_create();rig.animation_data.action=target.actions[0]
for track in rig.animation_data.nla_tracks:track.mute=True
holder=bpy.data.objects.new('Somangi_Game_Scale_Seat_Fit',None);bpy.context.collection.objects.link(holder)
holder.scale=(1/1.95,)*3
for obj in objects:
    if obj.parent not in objects:obj.parent=holder
scene=bpy.context.scene
def vertices(obj):
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    points=[evaluated.matrix_world@v.co for v in mesh.vertices];evaluated.to_mesh_clear();return points
scene.frame_set(25);bpy.context.view_layer.update()
ids=json.loads((source/'seat.json').read_text())['butt_vertex_ids']
points=vertices(body);hips=[points[i] for i in ids]
cx=(min(p.x for p in hips)+max(p.x for p in hips))/2
cy=(min(p.y for p in hips)+max(p.y for p in hips))/2
holder.location.x=-cx;holder.location.y=-.10-cy
bpy.context.view_layer.update()
cushion=bpy.data.objects['Sofa_Seat_Cushion']
def tree(obj):
    points=vertices(obj)
    return BVHTree.FromPolygons(points,[list(p.vertices) for p in obj.data.polygons]),points
seat_bvh,_=tree(cushion)
points=vertices(body);corrections=[]
for i in ids:
    p=points[i];hit=seat_bvh.ray_cast(Vector((p.x,p.y,2)),Vector((0,0,-1)))[0]
    if hit:corrections.append(hit.z-p.z)
holder.location.z=max(corrections)+.001
final_z=holder.location.z
scene.frame_set(1);bpy.context.view_layer.update()
floor_gap=min(p.z for p in vertices(body))
scene.render.fps=24;scene.frame_start=1;scene.frame_end=73
for frame in range(1,74):
    scene.frame_set(frame)
    u=(frame-1)/72
    t=u*3 if u<1/3 else (1 if u<=2/3 else 3-3*u)
    v=max(0,min(1,t/.4));blend=v*v*(3-2*v)
    a=max(0,min(1,(t-.15)/.45));amount=a*a*(3-2*a)
    for name in ['Leg.L','Leg.R']:
        bone=rig.pose.bones[name]
        bone.location += bone.bone.matrix_local.to_3x3().inverted() @ Vector((0,0,.065*amount))
        bone.keyframe_insert(data_path='location',frame=frame)
    holder.location.z=final_z-floor_gap*(1-blend)
    holder.keyframe_insert(data_path='location',frame=frame)
scene.frame_set(25);bpy.context.view_layer.update()
report={'game_changed':False,'character_source':'Existing bench sit v2; not newly adopted gameplay animation',
    'scale':1/1.95,'seat_fit_offset':list(holder.location),
    'preview_only_leg_lift_game_units':round(.065/1.95*100,3),'samples':[]}
solids=[]
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' and obj.name.startswith(('Sofa_Rounded_Arm','Sofa_Back_Cushion','Sofa_Seat_Cushion')):
        bvh,points=tree(obj);solids.append((obj.name,bvh,[min(p[j] for p in points) for j in range(3)],[max(p[j] for p in points) for j in range(3)]))
for frame in [1,7,13,19,25,37,49,55,61,67,73]:
    scene.frame_set(frame);bpy.context.view_layer.update();points=vertices(body);depths={}
    for name,bvh,lo,hi in solids:
        depth=0
        for p in points[::8]:
            if not all(lo[j]<p[j]<hi[j] for j in range(3)):continue
            near,normal,_,distance=bvh.find_nearest(p)
            if near is not None and (p-near).dot(normal)<0:depth=max(depth,distance)
        depths[name]=round(depth,5)
    report['samples'].append({'frame':frame,'penetration_depth':depths})
(out/'fit-report.json').write_text(json.dumps(report,indent=2))
scene.frame_set(25)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Sofa-somangi-sit-preview.blend'))
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=2.1;scene.camera=camera
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
for name,location in [('seated-angle',(2,-3,1.8)),('seated-side',(3,0,1.2))]:
    camera.location=location;camera.rotation_euler=(Vector((0,-.05,.8))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
camera.location=(2,-3,1.8);camera.rotation_euler=(Vector((0,-.05,.8))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=440;scene.render.resolution_y=440;scene.cycles.samples=6
for frame in range(1,74,2):
    scene.frame_set(frame);scene.render.filepath=str(out/f'motion-{frame:03}.png');bpy.ops.render.render(write_still=True)
print('FIT_REPORT',json.dumps(report))
