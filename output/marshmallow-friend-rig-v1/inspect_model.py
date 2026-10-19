import bpy, json
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
SOURCE = 'C:/Users/bogeu/Downloads/Meshy_AI_Marshmallow_Friend_1018075407_texture.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE)
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
vs = mesh.data.vertices
adj = [[] for _ in vs]
for edge in mesh.data.edges:
    a, b = edge.vertices
    adj[a].append(b); adj[b].append(a)
seen = set(); components = []
for i in range(len(vs)):
    if i in seen:
        continue
    stack = [i]; seen.add(i); ids = []
    while stack:
        k = stack.pop(); ids.append(k)
        for j in adj[k]:
            if j not in seen:
                seen.add(j); stack.append(j)
    components.append({'count': len(ids), 'bounds': [[min(vs[k].co[a] for k in ids), max(vs[k].co[a] for k in ids)] for a in range(3)]})
(P/'inspection.json').write_text(json.dumps({'vertices': len(vs), 'faces': len(mesh.data.polygons), 'components': sorted(components, key=lambda c: -c['count'])}, indent=2))
s = bpy.context.scene
s.render.engine = 'CYCLES'; s.cycles.samples = 16
s.render.resolution_x = 800; s.render.resolution_y = 800
s.render.resolution_percentage = 100
s.world = bpy.data.worlds.new('Studio'); s.world.use_nodes = True
s.world.node_tree.nodes['Background'].inputs[0].default_value = (.35,.35,.35,1)
s.world.node_tree.nodes['Background'].inputs[1].default_value = .7
for loc, power, size in [((3,-4,5),450,4),((-3,-2,2),250,3),((0,3,4),350,3)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    lamp=bpy.context.object; lamp.data.energy=power; lamp.data.shape='DISK'; lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,0))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object; cam.data.type='ORTHO'; cam.data.ortho_scale=2.35; s.camera=cam
def render(name, pos):
    cam.location=pos; cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png')); bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'source.blend'))
for name,pos in [('front',(0,-6,0)),('side',(6,0,0)),('back',(0,6,0)),('angle',(3,-6,1))]:
    render(name,pos)
print('INSPECTION_COMPLETE')
