import bpy,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-sit.glb'))
scene=bpy.context.scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
body=bpy.data.objects['Somangi_SmoothBody']
action=next(a for a in bpy.data.actions if a.name=='Sit_Cycle')
rig.animation_data.action=action
start,end=action.frame_range
meta=json.loads((P/'sit-metadata.json').read_text())
target=Vector((0,.13,-.04))
world=bpy.data.worlds.new('Seat preview studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.17,.17,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.8;scene.world=world
for pos,energy,size in [((-3,-4,5),450,4),((3,2,4),300,3),((-2,4,2),250,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
mat=bpy.data.materials.new('Neutral preview bench');mat.diffuse_color=(.20,.22,.24,1)
def cube(name,pos,scale,rounding=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel=o.modifiers.new('Soft edges','BEVEL');bevel.width=rounding;bevel.segments=3
    o.modifiers.new('Surface normals','WEIGHTED_NORMAL');o.data.materials.append(mat)
    return o
seat=meta['seatSurfaceZ']
cube('Preview bench seat',(0,.48,seat-.035),(1.05,.40,.07))
for x in [-.43,.43]:
    height=seat-.07-meta['floorZ']
    cube('Preview bench leg',(x,.48,meta['floorZ']+height/2),(.07,.10,height),.01)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,meta['floorZ']-.003))
floor=bpy.context.object;floor.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO'
camera.data.ortho_scale=2.35;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=500;scene.render.resolution_y=560;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
quick='--quick' in sys.argv
if not quick:
    scene.cycles.samples=8;scene.render.resolution_x=440;scene.render.resolution_y=520
views=[('front',(0,-5,.25)),('side',(5,-.10,.25)),('angle',(3,-5,1.1))] if quick else [('front',(0,-5,.25)),('side',(5,-.10,.25))]
for name,pos in views:
    camera.location=target+Vector(pos)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    folder=P/(name+'-frames');folder.mkdir(exist_ok=True)
    for i in ([0,12,24] if quick else range(42)):
        phase=i/(56 if quick else 42)
        f=start+(end-start)*phase
        scene.frame_set(int(f),subframe=f-int(f))
        scene.render.filepath=str(folder/f'{i:03}.png')
        bpy.ops.render.render(write_still=True)
