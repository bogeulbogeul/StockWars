import bpy,json
from mathutils import Vector
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v1')
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-base-face-v7/Anna-clean-face.blend')
def bounds(o):
 c=[o.matrix_world@Vector(v) for v in o.bound_box];return [[min(v[i] for v in c),max(v[i] for v in c)] for i in range(3)]
print('BODY',[(o.name,bounds(o)) for o in bpy.data.objects if o.type=='MESH'])
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/AnnaVest.glb')
vest=[o for o in bpy.context.selected_objects if o.type=='MESH']
print('VEST',[(o.name,len(o.data.vertices),bounds(o)) for o in vest])
for o in bpy.data.objects:
 if o.type=='MESH' and o not in vest:o.hide_render=True
s=bpy.context.scene;cam=s.camera
cam.location=(0,-4,1);target=Vector((0,0,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6
s.render.resolution_x=700;s.render.resolution_y=700;s.render.filepath=str(p/'vest-inspect.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'inspect.blend'))
