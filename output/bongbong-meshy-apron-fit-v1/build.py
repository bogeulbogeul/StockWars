import bpy, json, hashlib, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

P=Path(__file__).resolve().parent
SOURCE=Path('C:/Users/bogeu/Downloads/Meshy_AI_Coral_Trim_Apron_1021221613_texture.glb')
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'bongbong-apron-model-v3/Bongbong-apron.blend'))
s=bpy.context.scene
rig=bpy.data.objects['Somangi_Rig']
body_names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']
body={n:[tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in body_names}
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.name not in body_names+['Preview_Ground'] and not o.name.startswith('Bud_'):
        bpy.data.objects.remove(o,do_unlink=True)
rig.data.pose_position='REST'
bpy.context.view_layer.update()
torso=BVHTree.FromObject(bpy.data.objects['Eating_Torso'],bpy.context.evaluated_depsgraph_get())
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
garments=[o for o in bpy.context.selected_objects if o.type=='MESH']
assert len(garments)==1
o=garments[0]
o.name='Bongbong_Meshy_Apron'
raw_count=len(o.data.vertices)
lo=Vector([min(v.co[i] for v in o.data.vertices) for i in range(3)])
hi=Vector([max(v.co[i] for v in o.data.vertices) for i in range(3)])
center=(lo+hi)/2
for v in o.data.vertices:
    q=v.co-center
    x,y,z=q.x*.48,q.y*.68,q.z*.43-.33
    side=-1 if y<0 else 1
    hit=torso.ray_cast(Vector((x,side*2,z)),Vector((0,-side,0)),4)[0]
    if hit is not None:
        # Smooth depth-only clearance retains front outline, UVs and topology.
        target=abs(hit.y)+.022
        delta=(abs(y)-target)/.04
        radius=target+.04*(delta if delta>30 else math.log1p(math.exp(delta)))
        y=side*radius
    v.co=(x,y,z)
g=o.vertex_groups.new(name='Body')
g.add(list(range(len(o.data.vertices))),1,'REPLACE')
o.parent=rig
mod=o.modifiers.new('Follow original body rig','ARMATURE');mod.object=rig
rig.data.pose_position='POSE'
s.frame_set(7)
s.render.resolution_x=800;s.render.resolution_y=800;s.render.resolution_percentage=100
s.cycles.samples=24
cam=s.camera;cam.data.ortho_scale=2.7
target=Vector((0,-.01,.1))
for name,pos in [('front',(0,-6,.1)),('left',(-6,0,.1)),('right',(6,0,.1)),('back',(0,6,.1)),('three-quarter',(3,-6,1.2))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(0,-6,.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Bongbong-meshy-apron.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
    if ob==rig or ob.name in body_names or ob.name.startswith('Bud_') or ob==o:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Bongbong-meshy-apron.glb'),use_selection=True,export_format='GLB',export_animations=True,export_skins=True,export_cameras=False,export_lights=False)
assert all(body[n]==[tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in body_names)
o.data.calc_loop_triangles()
report={'source':str(SOURCE),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'source_vertices':raw_count,'fitted_vertices':len(o.data.vertices),'apron_triangles':len(o.data.loop_triangles),
        'source_bounds':[list(lo),list(hi)],'body_vertices_unchanged':True,
        'fit_scale':[.48,.68,.43],'fit_translation':[0,0,-.33],
        'depth_fit':'Smooth torso clearance along Y only; X/Z outline retained',
        'texture_and_material_preserved':True,'decimation':False}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('APRON_FIT_COMPLETE',json.dumps(report))
