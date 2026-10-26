import bpy,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from bench_scene import load_bench
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-jump-sit.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
action=next(a for a in bpy.data.actions if a.name=='Jump_Sit_Preview')
rig.animation_data.action=action
start,end=action.frame_range
meta=json.loads((P/'metadata.json').read_text());load_bench(meta)
scene=bpy.context.scene
world=bpy.data.worlds.new('Actual town bench jump studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.20,.20,.20,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.8;scene.world=world
target=Vector((0,.30,.32))
for pos,energy,size in [((-4,-5,6),500,5),((4,3,5),350,4),((-3,4,2),200,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,meta['floorZ']-.003))
mat=bpy.data.materials.new('Studio gray');mat.diffuse_color=(.3,.3,.3,1)
bpy.context.object.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO'
camera.data.ortho_scale=3.7;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=700;scene.render.resolution_y=750;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
quick='--quick' in sys.argv
if not quick:
    scene.cycles.samples=8;scene.render.resolution_x=480;scene.render.resolution_y=540
views=[('front',(0,-6,.35)),('side',(6,0,.35)),('angle',(3.7,-6,1.8))] if quick else [('front',(0,-6,.35)),('side',(6,0,.35))]
for view,pos in views:
    camera.location=target+Vector(pos)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    folder=P/(view+'-frames');folder.mkdir(exist_ok=True)
    for i in ([0,7,15,27] if quick else range(46)):
        phase=i/46
        frame=start+(end-start)*phase
        scene.frame_set(int(frame),subframe=frame-int(frame))
        scene.render.filepath=str(folder/f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
