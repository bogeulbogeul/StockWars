import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion

P = Path(__file__).resolve().parent
SOURCE = P.parent / 'somangi-face-smooth-v1/somangi-face-smooth.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
body = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
body.name = 'Somangi_SmoothBody'
bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
base = [v.co.copy() for v in body.data.vertices]
floor = min(v.z for v in base)

def smooth(a, b, x):
    t = max(0, min(1, (x-a)/(b-a)))
    return t*t*(3-2*t)

data = bpy.data.armatures.new('Somangi_WalkRig')
rig = bpy.data.objects.new('Somangi_WalkRig', data)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
root = data.edit_bones.new('Root')
root.head = (0, 0, -.60)
root.tail = (0, 0, -.30)
for side, sign in [('L', 1), ('R', -1)]:
    arm = data.edit_bones.new('Arm.'+side)
    arm.head = (sign*.275, 0, -.055)
    arm.tail = (sign*.48, 0, -.40)
    arm.parent = root
    leg = data.edit_bones.new('Leg.'+side)
    leg.head = (sign*.173, 0, -.59)
    leg.tail = (sign*.173, -.015, -.91)
    leg.parent = root
bpy.ops.object.mode_set(mode='OBJECT')
groups = {n: body.vertex_groups.new(name=n) for n in ['Root','Arm.L','Arm.R','Leg.L','Leg.R']}
soles = {'L': [], 'R': []}
for v in body.data.vertices:
    x, y, z = v.co
    side = 'L' if x >= 0 else 'R'
    arm_boundary = .265 + .21*max(0, -z-.045)
    arm = smooth(arm_boundary, arm_boundary+.085, abs(x)) * (1-smooth(-.02,.055,z))
    arm *= smooth(-.66,-.54,z)
    leg = (1-smooth(-.68,-.535,z)) * (1-arm)
    weights = {'Root': max(0,1-arm-leg), 'Arm.'+side: arm, 'Leg.'+side: leg}
    for name, weight in weights.items():
        if weight > 0: groups[name].add([v.index], weight, 'REPLACE')
    if z < floor+.065: soles[side].append(v.index)
modifier = body.modifiers.new('Walk skin', 'ARMATURE')
modifier.object = rig
body.parent = rig
body.matrix_parent_inverse = rig.matrix_world.inverted()
for p in rig.pose.bones:
    p.rotation_mode = 'QUATERNION'

def rotate(name, degrees):
    pb = rig.pose.bones[name]
    basis = pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion = basis.inverted() @ Quaternion((1,0,0), math.radians(degrees)) @ basis

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 25
rig.animation_data_create()
rig.animation_data.action = bpy.data.actions.new('Walk_InPlace')
rows = []
for frame in range(1,26):
    t = (frame-1)/24
    for pb in rig.pose.bones:
        pb.location = (0,0,0)
        pb.rotation_quaternion = (1,0,0,0)
    for side, phase in [('L', t%1), ('R', (t+.5)%1)]:
        if phase < .5:
            angle = -21+84*phase
            lift = 0
        else:
            u = (phase-.5)*2
            angle = 21-42*(u*u*(3-2*u))
            lift = .035*math.sin(math.pi*u)**2
        rotate('Leg.'+side, angle)
        pb = rig.pose.bones['Leg.'+side]
        pb.location = pb.bone.matrix_local.to_3x3().inverted() @ Vector((0,0,lift))
        rotate('Arm.'+side, -angle*.72)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    evaluated = body.evaluated_get(dg)
    evaluated_mesh = evaluated.to_mesh()
    sole_z = min(evaluated_mesh.vertices[i].co.z for ids in soles.values() for i in ids)
    evaluated.to_mesh_clear()
    rise = floor-sole_z
    root_pb = rig.pose.bones['Root']
    root_pb.location = root_pb.bone.matrix_local.to_3x3().inverted() @ Vector((0,0,rise))
    for pb in rig.pose.bones:
        pb.keyframe_insert('location', frame=frame, group=pb.name)
        pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)
    rows.append({'frame':frame,'groundCorrection':rise})

scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),use_selection=True,
    export_format='GLB',export_skins=True,export_animations=True,
    export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps({'fps':30,'cycleSeconds':.8,'keys':rows},indent=2))
print('WALK_BUILD_COMPLETE', len(base), 'vertices', {k:len(v) for k,v in soles.items()})
