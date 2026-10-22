import bpy, math
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
import sys
filename = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'somangi-slim.glb'
filename='somangi-motion-ready.blend'
for label, filename in [(Path(filename).stem, filename)]:
    bpy.ops.wm.open_mainfile(filepath=str(P / filename))
    label='cut-boundary-review'
    scene = bpy.context.scene
    for ob in list(scene.objects):
        ob.animation_data_clear()
        if ob.type == 'ARMATURE': ob.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    import json
    from collections import defaultdict
    body=bpy.data.objects['Somangi_SmoothBody']
    index=body.vertex_groups['Part.Root'].index
    ids=[v.index for v in body.data.vertices if any(g.group==index for g in v.groups)]
    count=json.loads((P/'build-validation.json').read_text())['parts']['Root']['surfaceVertices']
    original=set(ids[:count]);edges=defaultdict(int)
    for face in body.data.polygons:
        seq=list(face.vertices)
        if not all(i in original for i in seq):continue
        for a,b in zip(seq,seq[1:]+seq[:1]):edges[tuple(sorted((a,b)))]+=1
    mat=bpy.data.materials.new('Cut review red');mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(.8,.005,.005,1)
    bs.inputs['Emission Color'].default_value=(.8,.005,.005,1)
    bs.inputs['Emission Strength'].default_value=1
    curve=bpy.data.curves.new('Actual cut edge overlay','CURVE');curve.dimensions='3D'
    curve.bevel_depth=.0035;curve.bevel_resolution=2;curve.resolution_u=1
    for (a,b),uses in edges.items():
        if uses!=1:continue
        pa,pb=body.data.vertices[a].co.copy(),body.data.vertices[b].co.copy()
        if max(pa.y,pb.y)>-.015:continue
        spline=curve.splines.new('POLY');spline.points.add(1)
        for point,co in zip(spline.points,[pa,pb]):co.y-=.004;point.co=(*co,1)
    mark=bpy.data.objects.new('Review only cut lines',curve);scene.collection.objects.link(mark)
    curve.materials.append(mat)
    meshes = [o for o in scene.objects if o.type == 'MESH' and o.name.startswith('Somangi_SmoothBody')]
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    low = min(v.z for v in points)
    high = max(v.z for v in points)
    center = Vector((0, 0, (low + high) / 2))
    world = bpy.data.worlds.new('Studio'); world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .32, .32, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .7
    scene.world = world
    for location, energy, size in [((-3, -4, 5), 450, 4), ((3, -2, 3), 250, 3), ((0, 3, 4), 350, 3)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        lamp = bpy.context.object; lamp.data.energy = energy; lamp.data.shape = 'DISK'; lamp.data.size = size
        lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add()
    camera = bpy.context.object; camera.data.type = 'ORTHO'; camera.data.ortho_scale = (high - low) * 1.22
    scene.camera = camera
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 16
    scene.render.resolution_x = 650; scene.render.resolution_y = 800; scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'AgX'
    for view, offset in [('front', (0, -5, .05))]:
        camera.location = center + Vector(offset)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(P / f'{label}-{view}.png')
        bpy.ops.render.render(write_still=True)




