import bpy
from mathutils import Vector
from pathlib import Path

root = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root / 'Room-separated.glb'))
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(parts) == 5
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'Room-separated.blend'))
colors = {'Floor': (0.72, 0.51, 0.28, 1), 'Wall_Left': (0.45, 0.68, 0.79, 1),
          'Wall_Right': (0.63, 0.77, 0.45, 1), 'Wall_Back': (0.77, 0.58, 0.76, 1),
          'Wall_Front': (0.87, 0.66, 0.4, 1)}
for obj in parts:
    obj.color = colors[obj.name]
bpy.ops.object.camera_add(location=(3, -4, 3))
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.4
scene = bpy.context.scene
scene.camera = cam
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'OBJECT'
scene.display.shading.show_cavity = True
scene.render.resolution_x = 900
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.filepath = str(root / 'parts-preview.png')
bpy.ops.render.render(write_still=True)
for obj in parts:
    obj.location.x *= 1
    if obj.name == 'Floor':
        obj.location.z -= 0.55
    elif obj.name == 'Wall_Left':
        obj.location.x -= 0.4
    elif obj.name == 'Wall_Right':
        obj.location.x += 0.4
    elif obj.name == 'Wall_Back':
        obj.location.y += 0.4
    else:
        obj.location.y -= 0.4
cam.data.ortho_scale = 4.3
scene.render.filepath = str(root / 'exploded-preview.png')
bpy.ops.render.render(write_still=True)
print('VERIFIED: five mesh objects imported and editable Blender file saved')
