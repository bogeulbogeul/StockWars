import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/anna-model-v1');P.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Anna.glb')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
print('ANNA_MESH',[(o.name,len(o.data.vertices),[list(v) for v in o.bound_box]) for o in objects])
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
points=[o.matrix_world@v.co for o in objects for v in o.data.vertices];lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)));center=(lo+hi)/2;size=max(hi-lo)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.render.resolution_x=800;s.render.resolution_y=800;s.render.resolution_percentage=100
s.world.color=(.55,.55,.55)
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=size*1.2;s.camera=cam
for loc,energy in [((3,-4,5),700),((-3,-2,2),400)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)*size);bpy.context.object.data.energy=energy*size*size;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size*3
for name,direction in [('front',(0,-4,0)),('back',(0,4,0)),('side',(4,0,0))]:
 cam.location=center+Vector(direction)*size;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'-raw.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'inspection.blend'))
