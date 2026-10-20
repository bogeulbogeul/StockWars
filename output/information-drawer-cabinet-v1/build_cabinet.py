"""Small three-drawer cabinet beside Anna's chair, matching the office set."""
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
wood=material('Cabinet_Honey_Wood',(.56,.35,.16))
sage=material('Cabinet_Sage_Drawers',(.32,.43,.23))
cream=material('Cabinet_Cream_Frame',(.88,.79,.64))
interior=material('Cabinet_Interior_Wood',(.38,.24,.12))

box('Rounded_Wood_Top',(.90,.70,.075),(0,0,.8225),wood,.035)
box('Wood_Base',(.86,.66,.075),(0,0,.0875),wood,.025)
for x in [-.385,.385]:
    box('Cream_Side_Frame',(.07,.62,.67),(x,0,.455),cream,.015)
box('Cabinet_Back',(.72,.045,.67),(0,.2875,.455),cream,.012)
for z in [.13,.35,.57,.785]:
    box('Drawer_Separator',(.72,.62,.025),(0,0,z),cream,.006)
for x in [-.315,.315]:
    for y in [-.22,.22]:
        box('Short_Wood_Foot',(.10,.10,.10),(x,y,.05),wood,.018)

drawers=[]
for i,z in enumerate([.24,.46,.675],1):
    parent=bpy.data.objects.new('Drawer_'+str(i)+'_Slide',None)
    bpy.context.collection.objects.link(parent)
    before=set(bpy.context.scene.objects)
    box('Drawer_'+str(i)+'_Front',(.705,.045,.185),(0,-.3225,z),sage,.014)
    box('Drawer_'+str(i)+'_Bottom',(.64,.52,.018),(0,-.025,z-.075),interior,.004)
    for x in [-.313,.313]:
        box('Drawer_'+str(i)+'_Side',(.025,.52,.13),(x,-.025,z-.007),wood,.005)
    box('Drawer_'+str(i)+'_Back',(.64,.025,.13),(0,.223,z-.007),wood,.005)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=.037,location=(0,-.378,z))
    knob=bpy.context.object;knob.name='Drawer_'+str(i)+'_Round_Wood_Knob'
    knob.scale.y=.75
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(knob,wood,0)
    for p in knob.data.polygons:p.use_smooth=True
    for obj in set(bpy.context.scene.objects)-before:obj.parent=parent
    parent['slide_axis']='Blender -Y';parent['preview_travel']=.22
    drawers.append(parent)

asset=list(bpy.context.scene.objects)
assert all(math.isfinite(c) for obj in asset if obj.type=='MESH' for v in obj.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-drawer-cabinet.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.4))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-3,2))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.65
cam.rotation_euler=(Vector((0,0,.42))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.camera=cam
scene.render.filepath=str(ROOT/'cabinet.png');bpy.ops.render.render(write_still=True)
drawers[2].location.y=-.22
scene.render.filepath=str(ROOT/'drawer-open-check.png');bpy.ops.render.render(write_still=True)
drawers[2].location.y=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-drawer-cabinet.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'office-anna-vest-update-v1'/'Office-latest-anna-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Information-drawer-cabinet.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((1.30,2.30,.022))
scene=bpy.context.scene;cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=4.7
cam.location=(3.0,-4,3.5)
cam.rotation_euler=(Vector((.25,.9,.85))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-cabinet-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Cabinet produced; user art review and game integration pending',
    'dimensions':[.90,.70,.86],'units':'temporary office modeling units',
    'position':[1.30,2.30,.022],'chair_side_clearance':.455,
    'back_wainscot_clearance':.15,'drawer_count':3,
    'drawer_slide_axis':'Blender -Y','drawer_preview_travel':.22,
    'features':['separate drawer boxes','sage fronts','wood top','cream frame','round wood knobs'],
    'anna_source':'anna-meshy-short-vest-v5','game_changed':False
},indent=2),encoding='utf-8')
