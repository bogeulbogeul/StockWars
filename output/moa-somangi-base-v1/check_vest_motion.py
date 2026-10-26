"""Check vest/body signed nearest-surface distances across the authored walk."""
import bpy, json
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
P = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'moa.blend'))
scene = bpy.context.scene
body = bpy.data.objects['Somangi_SmoothBody']
vest = bpy.data.objects['Moa_GreenVest']
minimum, penetrations = 100, 0
bad = []
for frame in range(1,32):
    scene.frame_set(frame)
    graph = bpy.context.evaluated_depsgraph_get()
    tree = BVHTree.FromObject(body,graph)
    ev = vest.evaluated_get(graph)
    mesh = ev.to_mesh()
    for vertex in list(mesh.vertices)[::8]:
        pos = vest.matrix_world @ vertex.co
        point, normal, index, distance = tree.find_nearest(pos)
        # Ray parity is independent of the source mesh's inconsistent face winding.
        direction = Vector((1,.137,.071)).normalized()
        cursor, hits = pos.copy(), 0
        for _ in range(24):
            hit, _, _, _ = tree.ray_cast(cursor,direction,4)
            if hit is None:
                break
            hits += 1
            cursor = hit+direction*.00001
        signed = -distance if hits%2 else distance
        minimum = min(minimum,signed)
        penetrations += signed < -.001
        if signed < -.01 and len(bad)<8:
            bad.append(dict(frame=frame, pos=list(pos), closest=list(point)))
    ev.to_mesh_clear()
result = dict(walkFrames=31, minimumSignedDistance=minimum,
              samplesInsideBodyBeyondTolerance=penetrations, tolerance=.001)
(P/'vest-motion-check.json').write_text(json.dumps(result,indent=2))
print(result)
print(bad)
assert penetrations == 0
