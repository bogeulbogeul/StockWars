"""Render the actual authored rig; no image deformation or generated replacement."""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
ROOT = P.parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P / 'somangi-floor-sleep.blend'))
scene = bpy.context.scene
rig = bpy.data.objects['Somangi_WholeArmRig']
body = bpy.data.objects['Somangi_SmoothBody']
for i, material in enumerate(body.data.materials):
    name = material.name
    if 'Expression_smile' in name:
        body.data.materials[i] = bpy.data.materials[name.replace('smile', 'sleepy')]
world = bpy.data.worlds.new('Quiet evening studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.20, .23, .30, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .45
scene.world = world
target = Vector((0, -.25, -.20))
for pos, energy, size in [((-3, -4, 5), 350, 4), ((3, 1, 3), 220, 4)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.data.energy = energy
    light.data.size = size
    light.rotation_euler = (target - light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.953))
floor = bpy.context.object
mat = bpy.data.materials.new('Warm ivory ground')
mat.diffuse_color = (.27, .25, .22, 1)
floor.data.materials.append(mat)
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.65
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 8
scene.render.resolution_x = 480
scene.render.resolution_y = 520
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
quick = '--quick' in sys.argv
views = [('angle', (3, -5, 2.2)), ('front', (0, -6, .8)), ('side', (6, -.25, 1))]
for name, position in views:
    camera.location = target + Vector(position)
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    rig.animation_data.action = bpy.data.actions['FloorSleep_Idle']
    scene.frame_set(1)
    scene.render.filepath = str(P / (name + '.png'))
    bpy.ops.render.render(write_still=True)
    if name != 'angle' or quick:
        continue
    folder = P / 'frames'
    folder.mkdir(exist_ok=True)
    for i in range(72):
        time = i / 10
        action_name = 'FloorSleep_Down' if time < 3.2 else 'FloorSleep_Idle'
        rig.animation_data.action = bpy.data.actions[action_name]
        frame = 1 + (time if time < 3.2 else time - 3.2) * 30
        scene.frame_set(int(frame), subframe=frame % 1)
        scene.render.filepath = str(folder / f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
