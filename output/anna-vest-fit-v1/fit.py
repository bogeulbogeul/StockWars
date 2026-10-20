import bpy,json
from pathlib import Path
from mathutils import Vector
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v1')
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-base-face-v7/Anna-clean-face.blend')
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/AnnaVest.glb')
vest=[o for o in bpy.context.selected_objects if o.type=='MESH']
for o in vest:
 o.name='Anna_Vest';o.scale=(.36,.48,.40);o.location=(0,-.045,-.385)
s=bpy.context.scene;s.render.resolution_x=800;s.render.resolution_y=800;cam=s.camera;cam.data.ortho_scale=2.25
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 target=Vector((0,0,0));cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(p/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
