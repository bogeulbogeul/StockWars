"""Native matte wood-and-sage chair for the settlement office."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Anna_Chair_Honey_Wood',(.56,.35,.16))
sage=material('Anna_Chair_Sage_Upholstery',(.32,.43,.23),.95)
box('Seat_Wood_Frame',(.79,.73,.10),(0,0,.425),wood,.055)
box('Seat_Sage_Cushion',(.69,.63,.12),(0,-.025,.505),sage,.055)
for x in [-.285,.285]:
    for y in [-.255,.255]:
        box('Solid_Wood_Leg',(.105,.105,.42),(x,y,.21),wood,.022)
    box('Back_Wood_Upright',(.09,.10,.49),(x,.31,.66),wood,.022)
box('Front_Underseat_Apron',(.58,.07,.12),(0,-.26,.365),wood,.018)
for x in [-.285,.285]:
    box('Side_Underseat_Apron',(.07,.52,.12),(x,0,.365),wood,.018)

# Rounded arch back with a visible continuous wooden border.
outer=[(x,z+.58) for x,z in arch_outline(.355,.30)]
extrude('Rounded_Wood_Backrest',outer,.235,.345,wood,.025)
inner=[(x,z+.645) for x,z in arch_outline(.287,.245)]
extrude('Sage_Backrest_Pad',inner,.205,.245,sage,.025)

anchor=bpy.data.objects.new('Anna_Seat_Anchor',None)
bpy.context.collection.objects.link(anchor)
anchor.location=(0,-.025,.565)
anchor['purpose']='Provisional pelvis/contact target; seated Anna fit is not verified'
anchor['forward']='-Y in Blender; +Z after glTF conversion'
asset=list(bpy.context.scene.objects)
assert all(math.isfinite(c) for o in asset if o.type=='MESH' for v in o.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Anna-office-chair.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1000
scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object
    lamp.data.energy=power
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.55))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=1.65
scene.camera=cam
for name,loc in [('front-right',(2,-3,1.9)),('rear',(2,3,1.7))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,.59))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Anna-office-chair.blend'))

# Room placement preview only; preserve the empty shell source and export.
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-room-shell-v1'/'Information-room-shell.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Anna-office-chair.glb'))
# glTF importer restores Blender's Z-up coordinate system.
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:
        obj.location.y+=1.85
        obj.location.z+=.022
bpy.context.scene.render.filepath=str(ROOT/'room-preview.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-chair-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Chair model and room preview produced; art review and game integration pending',
    'dimensions_approx':[.79,.73,1.235],
    'units':'same temporary units as information-room-shell-v1',
    'seat_surface_z':.565,'seat_anchor':'Anna_Seat_Anchor',
    'front_axis_blender':'-Y','front_axis_gltf':'+Z',
    'armrests':False,'materials':['honey wood','sage upholstery'],
    'room_preview_position':[0,1.85,.022],
    'validation':{'finite_vertices':True,'rendered_front_and_rear':True},
    'pending':['Anna seated pose fit','leg and foot contact','desk clearance','game integration']
},indent=2),encoding='utf-8')
