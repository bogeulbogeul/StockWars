import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-walk.glb'))
scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
start,end=rig.animation_data.action.frame_range
world=bpy.data.worlds.new('Diagnostic magenta');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(1,0,1,1)
world.node_tree.nodes['Background'].inputs[1].default_value=1
scene.world=world
mat=bpy.data.materials.new('Opaque white no shadows');mat.use_nodes=True
nodes=mat.node_tree.nodes;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');emit=nodes.new('ShaderNodeEmission')
emit.inputs[0].default_value=(1,1,1,1);emit.inputs[1].default_value=1
mat.node_tree.links.new(emit.outputs[0],out.inputs['Surface'])
body=bpy.data.objects['Somangi_SmoothBody'];body.data.materials.clear();body.data.materials.append(mat)
for poly in body.data.polygons:poly.material_index=0
target=Vector((0,0,-.32))
bpy.ops.object.camera_add();camera=bpy.context.object
camera.data.type='ORTHO';camera.data.ortho_scale=1.42;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=4
scene.render.resolution_x=560;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
for label,offset in [('front',(0,-5,0)),('right',(5,0,0)),('back',(0,5,0)),('left',(-5,0,0))]:
    camera.location=target+Vector(offset)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    for phase in [0,.5]:
        f=start+(end-start)*phase;scene.frame_set(int(f),subframe=f-int(f))
        scene.render.filepath=str(P/f'diagnostic-{label}-{int(phase*8):02}.png')
        bpy.ops.render.render(write_still=True)
