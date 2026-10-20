"""Low round wood table and a composed sofa/rug waiting corner."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Waiting_Table_Honey_Wood',(.56,.35,.16))
def disk(name,r,depth,z):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=r,depth=depth,location=(0,0,z))
    obj=bpy.context.object;obj.name=name;finish(obj,wood,.018)
    for p in obj.data.polygons:
        if abs(p.normal.z)<.5:p.use_smooth=True
disk('Round_Wood_Tabletop',.43,.065,.3975)
disk('Recessed_Under_Table_Rim',.365,.045,.345)
for angle in [30,150,270]:
    a=math.radians(angle)
    box('Short_Rounded_Table_Leg',(.095,.095,.35),(.25*math.cos(a),.25*math.sin(a),.175),wood,.025)
root=bpy.data.objects.new('Waiting_Round_Coffee_Table',None);bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj!=root:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Waiting-round-table.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Waiting-round-table.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-floor-edge-v1'/'Office-floor-edge-preview.blend'))
def place(file,pos,angle=0,scale=1):
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(file))
    for obj in set(bpy.context.scene.objects)-before:
        if obj.parent is None:
            obj.matrix_world=Matrix.Translation(pos)@Matrix.Rotation(angle,4,'Z')@Matrix.Scale(scale,4)@obj.matrix_world

# Keep the rear desk exit aisles free: waiting zone occupies the front right.
place(ROOT.parent/'information-waiting-sofa-v1'/'Waiting-sage-sofa.glb',(3.20,-1.38,.022),-math.pi/2)
place(ROOT.parent/'information-round-rug-v1'/'Round-sage-rug.glb',(1.78,-1.38,.022),scale=1.05)
place(ROOT/'Waiting-round-table.glb',(1.42,-1.38,.049))
place(ROOT.parent/'information-potted-plant-v2'/'Small-potted-plant-v2.glb',(1.42,-1.38,.479),scale=.65)
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=3.1;cam.location=(.6,-4.4,3.1)
cam.rotation_euler=(Vector((2.7,-1.38,.55))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'waiting-corner.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-waiting-corner-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Table and waiting corner placed; game unchanged',
    'table_diameter':.86,'table_height':.43,'table_position':[1.42,-1.38,.049],
    'sofa_position':[3.20,-1.38,.022],'rug_position':[1.78,-1.38,.022],
    'sofa_frame_to_table_gap':.925,
    'plant':'potted-plant-v2 at .65 scale','units':'temporary office units',
    'pending':['user art review','character seating and movement','game integration']},indent=2),encoding='utf-8')
