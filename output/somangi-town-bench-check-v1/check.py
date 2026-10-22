import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
ROOT=P.parent.parent
char_path=P.parent/'somangi-sit-v1/somangi-sit.glb'
bench_path=ROOT/'web/assets/props/3d/Bench-clean.glb'
meta=json.loads((P.parent/'somangi-sit-v1/sit-metadata.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(char_path))
body=bpy.data.objects['Somangi_SmoothBody']
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.animation_data.action=next(a for a in bpy.data.actions if a.name=='Sit_Idle')
bpy.context.scene.frame_set(1)
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(bench_path))
bench_objects=[o for o in bpy.context.scene.objects if o not in before]
holder=bpy.data.objects.new('Actual_town_bench',None);bpy.context.collection.objects.link(holder)
for o in bench_objects:
    if o.parent not in bench_objects:o.parent=holder
# Town: bench seat=100*.32=32; bench source seat=.36.
# Character's retained loader scale is 100/1.95; use relative native units.
character_runtime_scale=100/1.95
bench_runtime_scale=32/.36
ratio=bench_runtime_scale/character_runtime_scale
holder.scale=(ratio,)*3
holder.location=(0,meta['seatFrontY']+.229*ratio,meta['floorZ'])
bpy.context.view_layer.update()
meshes=[o for o in bench_objects if o.type=='MESH']
seat_objects=[o for o in meshes if 'Seat_Slat' in o.name]
assert len(seat_objects)==3,[o.name for o in meshes]
seat_height=max((o.matrix_world@v.co).z for o in seat_objects for v in o.data.vertices)
height_offset=seat_height-meta['seatSurfaceZ']
trees=[]
for o in meshes:
    ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    trees.append(BVHTree.FromPolygons([ev.matrix_world@v.co for v in m.vertices],[list(p.vertices) for p in m.polygons]))
    ev.to_mesh_clear()
def inspect(offset):
    rig.location.z=offset;bpy.context.view_layer.update()
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    points=[ev.matrix_world@v.co for v in m.vertices];ev.to_mesh_clear()
    count=0;maximum=0
    for p in points:
        depths=[]
        for tree in trees:
            near,normal,_,distance=tree.find_nearest(p)
            signed=(p-near).dot(normal)
            if signed<-.002:depths.append(distance)
        if depths:count+=1;maximum=max(maximum,max(depths))
    return {'offsetZ':offset,'penetratingVertexSamples':count,'maximumNearestSurfaceDepth':maximum,
        'lowestPointAboveGround':min(p.z for p in points)-meta['floorZ']}
raw=inspect(0)
aligned=inspect(height_offset+.001)
report={'townBench':str(bench_path),'benchSha256':hashlib.sha256(bench_path.read_bytes()).hexdigest(),
    'characterRuntimeScale':character_runtime_scale,'benchRuntimeScale':bench_runtime_scale,
    'relativeBenchScale':ratio,'actualSeatZ':seat_height,'previewSeatZ':meta['seatSurfaceZ'],
    'requiredSeatHeightOffsetNative':height_offset,'requiredSeatHeightOffsetTown':height_offset*character_runtime_scale,
    'unaligned':raw,'heightAligned':aligned,'sourceModelsAndMotionUnchanged':True,
    'note':'Seated pose placement test. Existing sit-entry trajectory is not adapted to the taller town bench.'}
(P/'validation.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene
world=bpy.data.worlds.new('Town bench studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.20,.20,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.8;scene.world=world
target=Vector((0,.4,.12))
for pos,energy,size in [((-4,-5,6),500,5),((4,3,5),350,4),((-3,4,2),200,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size
    lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,meta['floorZ']-.003))
mat=bpy.data.materials.new('Studio floor');mat.diffuse_color=(.3,.3,.3,1)
bpy.context.object.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=3.7
scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=900;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for state,offset in [('unaligned',0),('aligned',height_offset+.001)]:
    rig.location.z=offset;bpy.context.view_layer.update()
    for view,pos in [('front',(0,-6,.65)),('side',(6,0,.65)),('angle',(3.7,-6,2.0))]:
        if state=='unaligned' and view!='angle':continue
        camera.location=target+Vector(pos)
        camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(P/f'{state}-{view}.png');bpy.ops.render.render(write_still=True)
rig.location.z=height_offset+.001
bpy.ops.wm.save_as_mainfile(filepath=str(P/'town-bench-seat-check.blend'))
print('TOWN_BENCH_CHECK',report)
