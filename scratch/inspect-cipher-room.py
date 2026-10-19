import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

SOURCE = r'C:/Users/bogeu/Downloads/Meshy_AI_Blue_Trimmed_Empty_Ro_1018221403_generate.glb'
OUT = Path('C:/GitHub/StockWars/output/cipher-room-repaired-v1')
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
points = [o.matrix_world @ v.co for o in objects for v in o.data.vertices]
lo = [min(v[i] for v in points) for i in range(3)]
hi = [max(v[i] for v in points) for i in range(3)]
print('BOUNDS', lo, hi)
for axis in [0, 1]:
    for sign in [-1, 1]:
        near = [p for p in points if sign * p[axis] > .82 and -.23 < p.z < .05]
        other = 1 - axis
        bins = [sum(-.9 + i * .1 <= p[other] < -.8 + i * .1 for p in near) for i in range(18)]
        print('WALL BINS', axis, sign, bins)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.studiolight_rotate_z = .5
scene.display.shading.color_type = 'SINGLE'
scene.display.shading.single_color = (.72, .72, .72)
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = False
scene.display.shading.background_type = 'WORLD'
scene.world.color = (.12, .12, .12)
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
bpy.ops.object.camera_add(location=(2.6, -3.7, 3.5))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, -.04)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.15
scene.camera = camera
scene.render.filepath = str(OUT / 'original-gray.png')
bpy.ops.render.render(write_still=True)
(OUT / 'source-analysis.json').write_text(json.dumps({'bounds': [lo, hi], 'vertices': len(points)}, indent=2))
