import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

P = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-walk.glb'))
scene = bpy.context.scene
scene.render.fps = 24
body = bpy.data.objects['Somangi_SmoothBody']
torso=bpy.data.objects['Eating_Torso']
arms=[bpy.data.objects['Rigid_Arm.'+side] for side in ['L','R']]
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
assert rig.animation_data and rig.animation_data.action, 'Missing walk clip'
duration = rig.animation_data.action.frame_range[1]-rig.animation_data.action.frame_range[0]
start = rig.animation_data.action.frame_range[0]
base = [v.co.copy() for v in body.data.vertices]
feet = [v.index for v in body.data.vertices if v.co.z < -.85]
floor = min(v.z for v in base)
first = None
penetration = gap = loop = 0
torso_error=0
arm_first={}
arm_travel=0
embedded=1000000
shoulder_embedded=1000000
arm_loop=0
torso_base=[v.co.copy() for v in torso.data.vertices]
thighs={side:[v.index for v in body.data.vertices if -.64<v.co.z<-.53 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
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
    ev.to_mesh_clear()
    te=torso.evaluated_get(dg)
    tm=te.to_mesh()
    tc=[v.co.copy() for v in tm.vertices]
    delta=tc[0]-torso_base[0]
    torso_error=max(torso_error,max((v-b-delta).length for v,b in zip(tc,torso_base)))
    tree=BVHTree.FromPolygons(tc,[list(p.vertices) for p in tm.polygons])
    for side,ids in thighs.items():
        count=0
        for index in ids:
            near,normal,_,distance=tree.find_nearest(points[index])
            if near is not None and (points[index]-near).dot(normal)<-.001:count+=1
        embedded=min(embedded,count)
    te.to_mesh_clear()
    for arm in arms:
        ae=arm.evaluated_get(dg)
        am=ae.to_mesh()
        ac=[v.co.copy() for v in am.vertices]
        if sample==0:arm_first[arm.name]=ac
        arm_travel=max(arm_travel,max((v-b-delta).length for v,b in zip(ac,arm_first[arm.name])))
        count=0
        for index,v in enumerate(arm.data.vertices):
            if v.co.z<-.16 or abs(v.co.x)>.32:continue
            near,normal,_,distance=tree.find_nearest(ac[index])
            if near is not None and (ac[index]-near).dot(normal)<-.001:count+=1
        shoulder_embedded=min(shoulder_embedded,count)
        if sample==96:arm_loop=max(arm_loop,max((a-b).length for a,b in zip(ac,arm_first[arm.name])))
        ae.to_mesh_clear()
report = {'samples':97,'clips':[a.name for a in bpy.data.actions],
    'durationSeconds':duration/scene.render.fps,'floorPenetration':penetration,'supportGap':gap,'loopError':loop,
    'torsoShapeError':torso_error,'armTravel':arm_travel,'minimumEmbeddedThighVertices':embedded,
    'minimumEmbeddedShoulderVertices':shoulder_embedded,'armLoopError':arm_loop}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('VALIDATION',report)
assert loop < 1e-5 and penetration < .012 and gap < .012,report
assert torso_error<1e-5 and arm_travel>.08 and embedded>0,report
assert shoulder_embedded>0 and arm_loop<1e-5,report
if '--check-only' in sys.argv:sys.exit(0)

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
