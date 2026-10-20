"""Round woven cream rug with a sage border, as a separate mesh asset."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('Rug_Woven_Cream',(.74,.66,.48),1)
light=material('Rug_Light_Fiber',(.82,.75,.59),1)
sage=material('Rug_Sage_Border',(.32,.43,.23),1)
sage_light=material('Rug_Sage_Stitch',(.40,.49,.30),1)
bpy.ops.mesh.primitive_cylinder_add(vertices=160,radius=.82,depth=.014,location=(0,0,.007))
base=bpy.context.object;base.name='Round_Rug_Base';finish(base,cream,.005)

def ring(name,radius,tube,z,mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=tube,
        major_segments=160,minor_segments=8,location=(0,0,z))
    obj=bpy.context.object;obj.name=name;obj.data.materials.append(mat)
    for p in obj.data.polygons:p.use_smooth=True

for i in range(35):
    r=.025+i*.0205
    ring('Concentric_Woven_Coil',r,.006,.015,light if i%2 else cream)
for i in range(5):ring('Sage_Woven_Border',.748+i*.015,.010,.014,sage if i%2 else sage_light)
# Short raised bindings cross the green border at regular intervals.
for i in range(96):
    a=i*2*math.pi/96
    obj=box('Border_Binding_Stitch',(.004,.065,.003),(.78*math.cos(a),.78*math.sin(a),.024),sage_light,.001)
    obj.rotation_euler.z=a-math.pi/2
root=bpy.data.objects.new('Information_Round_Woven_Rug',None);bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj!=root:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Round-sage-rug.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
floor=material('Preview_Wood_Floor',(.60,.40,.21))
box('Preview_Floor',(200,200,.04),(0,0,-.022),floor,0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-3,4))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.2
cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'rug.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Round-sage-rug.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Independent rug model; placement and game integration pending',
    'diameter':1.64,'thickness_approx':.027,'units':'temporary office modeling units',
    'features':['cream concentric woven coils','sage circular border','raised binding stitches'],
    'reference':'user waiting-area rug image','game_changed':False},indent=2),encoding='utf-8')
