import bpy
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\bogeu\Downloads\Room.glb')
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
print('BOUNDS', [(min(v.co[i] for v in obj.data.vertices), max(v.co[i] for v in obj.data.vertices)) for i in range(3)])
bpy.ops.object.camera_add(location=(3, -4, 3))
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.4
scene = bpy.context.scene
scene.camera = cam
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 900
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.filepath = r'C:\GitHub\StockWars\output\room-separated-v1\original.png'
bpy.ops.render.render(write_still=True)
