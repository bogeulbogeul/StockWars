import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/anna-painted-retouch-v1');P.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Anna.glb')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
for i,im in enumerate(bpy.data.images):
 if im.type!='IMAGE' or not im.has_data:continue
 im.filepath_raw=str(P/f'input-texture-{i}.png');im.file_format='PNG';im.save()
print('STRUCTURE',[(o.name,len(o.data.vertices),[list(v) for v in o.bound_box]) for o in objects])
points=[o.matrix_world@v.co for o in objects for v in o.data.vertices];lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)));center=(lo+hi)/2;size=max(hi-lo)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100;s.world.color=(.55,.55,.55)
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.2;s.camera=cam
for loc,energy in [((3,-4,4),400),((-3,-3,1),230),((0,4,4),450)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc));a=bpy.context.object;a.data.energy=energy;a.data.shape='DISK';a.data.size=4;a.rotation_euler=(center-a.location).to_track_quat('-Z','Y').to_euler()
for name,d in [('front',(0,-4,0)),('back',(0,4,0)),('right',(4,0,0)),('angle',(2.7,-4,.2))]:
 cam.location=center+Vector(d)*size;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'-before.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'input.blend'))
