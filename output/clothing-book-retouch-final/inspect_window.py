import bpy,pathlib
from mathutils import Vector
root=pathlib.Path('C:/GitHub/StockWars/output/clothing-book-retouch-final')
bpy.ops.wm.open_mainfile(filepath=str(root/'ClothingStore.blend'))
for o in list(bpy.context.scene.objects):
 if o.type=='MESH': bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(root/'ClothingStore-retouched.glb'))
s=bpy.context.scene; target=Vector((-.52,-.7,-.22)); s.camera.location=target+Vector((.12,-2,.4)); s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler(); s.camera.data.ortho_scale=.85
s.render.resolution_x=1200;s.render.resolution_y=1200;s.render.filepath=str(root/'ClothingStore-window-before.png');bpy.ops.render.render(write_still=True)
