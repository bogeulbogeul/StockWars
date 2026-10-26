import bpy, math, json
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-walk.glb'))
scene = bpy.context.scene
scene.render.fps = 24
body = next(o for o in scene.objects if o.type == 'MESH')
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
assert rig.animation_data and rig.animation_data.action, 'Missing walk clip'
duration = rig.animation_data.action.frame_range[1]-rig.animation_data.action.frame_range[0]
start = rig.animation_data.action.frame_range[0]
base = [v.co.copy() for v in body.data.vertices]
feet = [v.index for v in body.data.vertices if v.co.z < -.85]
floor = min(v.z for v in base)
first = None
penetration = gap = loop = 0
root_ids=[v.index for v in body.data.vertices if any(g.group==body.vertex_groups['Root'].index and g.weight>.99999 for g in v.groups)]
root_error=0
for sample in range(97):
    f = start+duration*sample/96
    scene.frame_set(int(f),subframe=f-int(f))
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    m = ev.to_mesh()
    points = [v.co.copy() for v in m.vertices]
    assert all(math.isfinite(c) for v in points for c in v)
    low = min(points[i].z for i in feet)
    penetration = max(penetration,floor-low)
    gap = max(gap,low-floor)
    if sample == 0: first=points
    if sample == 96: loop=max((a-b).length for a,b in zip(points,first))
    shift=points[root_ids[0]]-base[root_ids[0]]
    root_error=max(root_error,max((points[i]-base[i]-shift).length for i in root_ids))
    ev.to_mesh_clear()
report = {'samples':97,'clips':[a.name for a in bpy.data.actions],
    'durationSeconds':duration/scene.render.fps,'floorPenetration':penetration,'supportGap':gap,'loopError':loop,
    'bodyShapeError':root_error}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('VALIDATION',report)
assert loop < 1e-5 and penetration < .012 and gap < .012,report
assert root_error<1e-5,report

world = bpy.data.worlds.new('Studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.14,.14,.14,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .7
scene.world = world
target = Vector((0,0,.025))
for pos,energy,size in [((-3,-4,5),400,4),((3,-2,3),230,3),((0,3,4),300,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    ob=bpy.context.object
    ob.data.energy=energy
    ob.data.shape='DISK'
    ob.data.size=size
    ob.rotation_euler=(target-ob.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,floor-.003))
ground=bpy.context.object
mat=bpy.data.materials.new('Studio floor')
mat.diffuse_color=(.075,.075,.075,1)
ground.data.materials.append(mat)
bpy.ops.object.camera_add()
camera=bpy.context.object
camera.data.type='ORTHO'
camera.data.ortho_scale=2.35
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.samples=8
scene.render.resolution_x=440
scene.render.resolution_y=520
scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for view,pos in [('front',(0,-6,.12)),('side',(6,-.05,.12))]:
    folder=P/(view+'-frames')
    folder.mkdir(exist_ok=True)
    camera.location=pos
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    for i in range(24):
        f=start+duration*i/24
        scene.frame_set(int(f),subframe=f-int(f))
        scene.render.filepath=str(folder/f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
