"""Small round visitor stool matching the settlement desk and Anna chair."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Visitor_Stool_Honey_Wood',(.56,.35,.16))
sage=material('Visitor_Stool_Sage_Cushion',(.32,.43,.23),.95)

def round_seat(name,radius,depth,z,mat,bevel):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=radius,depth=depth,location=(0,0,z))
    obj=bpy.context.object;obj.name=name
    finish(obj,mat,bevel)
    for polygon in obj.data.polygons:
        if abs(polygon.normal.z)<.5:polygon.use_smooth=True
    return obj

round_seat('Round_Wood_Seat',.33,.075,.3625,wood,.025)
round_seat('Round_Sage_Cushion',.30,.095,.4425,sage,.038)
for x in [-.18,.18]:
    for y in [-.18,.18]:
        box('Short_Rounded_Wood_Leg',(.085,.085,.34),(x,y,.17),wood,.020)
for x in [-.18,.18]:
    box('Side_Leg_Brace',(.045,.36,.045),(x,0,.15),wood,.010)
for y in [-.18,.18]:
    box('Front_Back_Leg_Brace',(.36,.045,.045),(0,y,.15),wood,.010)
anchor=bpy.data.objects.new('Somangi_Visitor_Seat_Anchor',None)
bpy.context.collection.objects.link(anchor);anchor.location=(0,0,.49)
anchor['purpose']='Provisional seat surface; character fit not verified'
asset=list(bpy.context.scene.objects)
assert all(math.isfinite(c) for o in asset if o.type=='MESH' for v in o.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Somangi-visitor-stool.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=900
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.25))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-3,2))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.20
cam.rotation_euler=(Vector((0,0,.24))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.camera=cam;scene.render.filepath=str(ROOT/'stool.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Somangi-visitor-stool.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'anna-chair-fit-v1'/'Anna-chair-fit-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Somangi-visitor-stool.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((0,-.40,.022))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=4.0;cam.location=(3,-4,3.5)
cam.rotation_euler=(Vector((0,.8,.8))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'desk-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-visitor-stool-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Visitor stool produced; character fit and game integration pending',
    'width':.66,'depth':.66,'seat_height':.49,
    'units':'temporary office modeling units','position':[0,-.4,.022],
    'desk_front_y':.41,'stool_rear_y':-.07,'gap_to_desk':.48,
    'seat_anchor':'Somangi_Visitor_Seat_Anchor',
    'features':['round wood seat','sage cushion','four short legs','low braces'],
    'anna_in_preview':'existing provisional floor-sitting fit; not final chair pose',
    'game_changed':False},indent=2),encoding='utf-8')
