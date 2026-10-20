import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/anna-base-face-v1');P.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Anna.glb')
o=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
v=[o.matrix_world@v.co for v in o.data.vertices];lo=Vector([min(v[i] for v in v) for i in range(3)]);hi=Vector([max(v[i] for v in v) for i in range(3)]);center=(lo+hi)/2;size=max(hi-lo)
print('BOUNDS',list(lo),list(hi),'VERTS',len(v))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=800;s.render.resolution_y=800;s.render.resolution_percentage=100;s.world.color=(.55,.55,.55)
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.2;s.camera=cam
for loc,energy in [((3,-4,4),400),((-3,-3,1),230),((0,4,4),450)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc));a=bpy.context.object;a.data.energy=energy;a.data.shape='DISK';a.data.size=4;a.rotation_euler=(center-a.location).to_track_quat('-Z','Y').to_euler()
for name,delta in [('front',(0,-4,0)),('side',(4,0,0)),('back',(0,4,0))]:
 cam.location=center+Vector(delta);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'-before.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'input.blend'))
