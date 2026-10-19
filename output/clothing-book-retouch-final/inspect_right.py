import bpy,pathlib
from mathutils import Vector
r=pathlib.Path('C:/GitHub/StockWars/output/clothing-book-retouch-final');bpy.ops.wm.open_mainfile(filepath=str(r/'ClothingStore-planter-clean.blend'))
s=bpy.context.scene;target=Vector((.50,-.7,-.22));s.camera.location=target+Vector((.12,-2,.4));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=.85;s.render.resolution_x=1200;s.render.resolution_y=1200;s.render.filepath=str(r/'right-window-reference.png');bpy.ops.render.render(write_still=True)
