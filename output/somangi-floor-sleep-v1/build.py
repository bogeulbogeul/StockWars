"""Grounded curl-up sleep on the accepted v43/v6 body, without editing vertices."""
import bpy
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from mathutils import Matrix, Quaternion, Vector

P = Path(__file__).resolve().parent
ROOT = P.parents[1]
SOURCE = ROOT / 'output/somangi-game-v1/somangi-walk.blend'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
rig = bpy.data.objects['Somangi_WholeArmRig']
body = bpy.data.objects['Somangi_SmoothBody']
for obj in list(scene.objects):
    if obj not in (rig, body):
        bpy.data.objects.remove(obj, do_unlink=True)
rig.animation_data_clear()
body.animation_data_clear()
if body.data.shape_keys:
    body.data.shape_keys.animation_data_clear()
for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)


def geometry_hash():
    verts = np.array([v.co[:] for v in body.data.vertices], dtype='<f4')
    return hashlib.sha256(verts.tobytes()).hexdigest()


before = geometry_hash()
bpy.context.view_layer.objects.active = rig
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for side, sign in [('L', 1), ('R', -1)]:
    ankle = rig.data.edit_bones.new('Foot.' + side)
    ankle.head = (sign * .14, 0, -.81)
    ankle.tail = (sign * .14, -.10, -.90)
    ankle.parent = rig.data.edit_bones['Leg.' + side]
bpy.ops.object.mode_set(mode='OBJECT')
for side in ['L', 'R']:
    leg = body.vertex_groups['Leg.' + side]
    foot = body.vertex_groups.new(name='Foot.' + side)
    for vertex in body.data.vertices:
        if vertex.co.z > -.77:
            continue
        weight = next((g.weight for g in vertex.groups if g.group == leg.index), 0)
        blend = max(0, min(1, (-vertex.co.z - .77) / .09))
        blend = blend * blend * (3 - 2 * blend)
        if weight * blend > 0:
            foot.add([vertex.index], weight * blend, 'REPLACE')
            leg.add([vertex.index], weight * (1 - blend), 'REPLACE')
for bone in rig.pose.bones:
    bone.rotation_mode = 'QUATERNION'
    bone.rotation_quaternion = Quaternion()
    bone.location = (0, 0, 0)
    bone.scale = (1, 1, 1)
floor = -.950641572
scene.render.fps = 30


def smooth(t):
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def rotation(name, x=0, y=0, z=0):
    bone = rig.pose.bones[name]
    basis = bone.bone.matrix_local.to_quaternion()
    q = Quaternion((0, 0, 1), math.radians(z))
    q @= Quaternion((0, 1, 0), math.radians(y))
    q @= Quaternion((1, 0, 0), math.radians(x))
    bone.rotation_quaternion = basis.inverted() @ q @ basis


def evaluated():
    obj = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = obj.to_mesh()
    data = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get('co', data)
    obj.to_mesh_clear()
    return data.reshape(-1, 3)


def pose(progress, breath=0):
    q = smooth(progress)
    settle = smooth((progress - .35) / .65)
    lean = 20 * settle + .45 * breath * settle
    rotation('Body', lean)
    rotation('Head', 8 * settle + .35 * breath * settle, z=-4 * settle)
    for side, sign in [('L', 1), ('R', -1)]:
        rotation('Leg.' + side, -130 * q)
        rotation('Foot.' + side, 130 * q - lean)
        rotation('Arm.' + side, -52 * q, y=sign * 40 * q)
        rig.pose.bones['Leg.' + side].location = (0, 0, 0)
    root = rig.pose.bones['Body']
    root.location = (0, 0, 0)
    bpy.context.view_layer.update()
    minimum = float(evaluated()[:, 2].min())
    root.location = root.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, floor - minimum))
    bpy.context.view_layer.update()


clips = {}


def make_action(name, frames, sample):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame in range(1, frames + 1):
        scene.frame_set(frame)
        progress, breathing = sample((frame - 1) / (frames - 1))
        pose(progress, breathing)
        for bone in rig.pose.bones:
            bone.keyframe_insert('location', frame=frame, group=bone.name)
            bone.keyframe_insert('rotation_quaternion', frame=frame, group=bone.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
    clips[name] = (frames - 1) / 30
    return action


down = make_action('FloorSleep_Down', 97, lambda t: (t, 0))
idle = make_action('FloorSleep_Idle', 121, lambda t: (1, math.sin(t * math.tau)))
up = make_action('FloorSleep_Up', 97, lambda t: (1 - t, 0))
assert geometry_hash() == before
for index, material in enumerate(body.data.materials):
    if material and 'Expression_smile' in material.name:
        body.data.materials[index] = bpy.data.materials[material.name.replace('smile', 'sleepy')]
rig.animation_data.action = down
scene.frame_start = 1
scene.frame_end = 97
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(P / 'somangi-floor-sleep.blend'))
bpy.ops.export_scene.gltf(filepath=str(P / 'somangi-floor-sleep.glb'),
    use_selection=True, export_format='GLB', export_skins=True,
    export_animations=True, export_animation_mode='ACTIONS',
    export_cameras=False, export_lights=False)
(P / 'build.json').write_text(json.dumps(dict(source=str(SOURCE.relative_to(ROOT)),
    restVerticesSHA256=before, restVerticesUnchanged=True, clips=clips,
    floorZ=floor, sleepExpression='sleepy (existing v6); embedded in GLB',
    gameInstalled=False, wholeArms=True), indent=2), encoding='utf-8')
print('FLOOR_SLEEP_BUILT', clips)
