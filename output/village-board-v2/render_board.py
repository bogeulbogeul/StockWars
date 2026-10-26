import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/noticeboard-clean-v1/NoticeBoard-clean.blend')
s=bpy.context.scene
bpy.data.objects['Preview_Ground'].hide_render=True
s.render.film_transparent=True
s.camera.location=(0,-8,1.14)
s.camera.rotation_euler=(Vector((0,0,1.14))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.camera.data.ortho_scale=2.62
s.render.resolution_x=1200
s.render.resolution_y=1080
s.render.resolution_percentage=100
s.cycles.samples=32
s.render.image_settings.file_format='PNG'
s.render.filepath='C:/GitHub/StockWars/web/assets/ui/village-board-frame.png'
bpy.ops.render.render(write_still=True)
