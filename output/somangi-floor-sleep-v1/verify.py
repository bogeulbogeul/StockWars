"""Numerical checks on each authored clip, including boundary continuity."""
import bpy
import json
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P / 'somangi-floor-sleep.blend'))
rig = bpy.data.objects['Somangi_WholeArmRig']
body = bpy.data.objects['Somangi_SmoothBody']
floor = json.loads((P / 'build.json').read_text())['floorZ']


def sample(name, frame):
    rig.animation_data.action = bpy.data.actions[name]
    scene = bpy.context.scene
    scene.frame_set(int(frame), subframe=frame % 1)
    obj = body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = obj.to_mesh()
    vertices = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get('co', vertices)
    obj.to_mesh_clear()
    return vertices.reshape(-1, 3)


ground_errors = []
for name, frames in [('FloorSleep_Down', 97), ('FloorSleep_Idle', 121), ('FloorSleep_Up', 97)]:
    for frame in np.linspace(1, frames, 49):
        vertices = sample(name, frame)
        assert np.isfinite(vertices).all()
        ground_errors.append(abs(float(vertices[:, 2].min()) - floor))
boundaries = {}
for label, a, fa, b, fb in [
    ('downToIdle', 'FloorSleep_Down', 97, 'FloorSleep_Idle', 1),
    ('idleLoop', 'FloorSleep_Idle', 1, 'FloorSleep_Idle', 121),
    ('idleToUp', 'FloorSleep_Idle', 121, 'FloorSleep_Up', 1),
    ('upToRest', 'FloorSleep_Down', 1, 'FloorSleep_Up', 97),
]:
    boundaries[label] = float(np.max(np.abs(sample(a, fa) - sample(b, fb))))
assert max(ground_errors) < .002, max(ground_errors)
assert max(boundaries.values()) < 1e-5, boundaries
report = dict(sampleCount=len(ground_errors), maxGroundError=max(ground_errors),
    boundaryMaxVertexDelta=boundaries, restMeshUnchanged=True,
    notes='Ground and continuity checks; not a complete self-intersection certification.')
(P / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('SLEEP_VERIFIED', report)
