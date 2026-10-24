"""Render selected GLB leaf loops and check deformed mesh loop closure."""
import bpy, numpy as np, json, math, sys
from pathlib import Path
from mathutils import Vector
P = Path(__file__).resolve().parent
code = (P/'build.py').read_text()
setup = code.split('# Render the exported model itself, not a separate illustration.')[1].split('for name, pos in')[0]
exec(setup)
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
leaf = next(o for o in scene.objects if o.type == 'MESH' and 'leaf' in o.data.name.lower())
rig.animation_data_create()
for track in rig.animation_data.nla_tracks:
    track.mute = True
target = Vector((.23,0,1.23))
cam.location = (.23,-6,1.23)
cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale = 1.05
scene.render.resolution_x = 480
scene.render.resolution_y = 480
scene.cycles.samples = 16
report = {}
def coords(frame):
    scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))
    obj = leaf.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = obj.to_mesh()
    values = np.array([v.co[:] for v in mesh.vertices])
    obj.to_mesh_clear()
    return values
for action in bpy.data.actions:
    if not action.name.startswith('Moa_Leaf_'):
        continue
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    start,end = action.frame_range
    first,last = coords(start),coords(end)
    middle = coords(start+(end-start)*.25)
    error = float(np.max(np.abs(last-first)))
    motion = float(np.max(np.linalg.norm(middle-first,axis=1)))
    print(action.name, 'loop', error, 'motion', motion, flush=True)
    assert error < 1e-5 and motion > .005
    report[action.name] = dict(loopPositionError=error, quarterCycleMovement=motion)
moods = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['Happy']
for mood in moods:
    action = next(a for a in bpy.data.actions if a.name == 'Moa_Leaf_'+mood)
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    folder = P/(mood.lower()+'-frames')
    folder.mkdir(exist_ok=True)
    start, end = action.frame_range
    for i in range(16):
        frame = start+(end-start)*i/16
        scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))
        scene.render.filepath = str(folder/f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
(P/'leaf-motion-check.json').write_text(json.dumps(report,indent=2))
