"""Blank village-map frame with a matching two-tier brochure rack."""
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
wood=material('MapStand_Honey_Wood',(.56,.35,.16))
blank=material('MapStand_Blank_Cream_Map',(.88,.83,.70))
paper=material('MapStand_Brochure_Paper',(.93,.88,.74))
sage=material('MapStand_Sage_Cover',(.32,.43,.23))
ivory=material('MapStand_Cream_Cover',(.83,.76,.59))
root=bpy.data.objects.new('Blank_Map_And_Brochure_Stand',None)
bpy.context.collection.objects.link(root)
# Local front is -Y; the map is intentionally completely unprinted.
box('Map_Wood_Backing',(1.48,.075,1.12),(0,.035,1.52),wood,.035)
box('Blank_Map_Insert',(1.32,.018,.96),(0,-.012,1.52),blank,.008)
for x in [-.735,.735]:
    box('Map_Frame_Upright',(.095,.13,2.12),(x,0,1.06),wood,.025)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=.068,location=(x,0,2.12))
    cap=bpy.context.object;cap.name='Rounded_Post_Cap';cap.data.materials.append(wood)
    for p in cap.data.polygons:p.use_smooth=True
for z in [1.00,2.04]:box('Map_Frame_Rail',(1.40,.105,.09),(0,-.004,z),wood,.022)

box('Rack_Base',(1.51,.44,.085),(0,-.12,.065),wood,.020)
for x in [-.70,.70]:
    box('Rack_Side',(.07,.40,.62),(x,-.12,.36),wood,.015)
for row in range(2):
    y=-.23+row*.16;z=.18+row*.24
    box('Rack_Shelf',(1.34,.19,.035),(0,y,z),wood,.010)
    box('Rack_Front_Retaining_Rail',(1.40,.035,.06),(0,y-.095,z+.105),wood,.012)
    for col in range(4):
        x=-.48+col*.32
        holder=bpy.data.objects.new('Brochure_'+str(row)+'_'+str(col),None)
        bpy.context.collection.objects.link(holder)
        before=set(bpy.context.scene.objects)
        box('Brochure_Pages',(.19,.022,.245),(0,0,.1225),paper,.003)
        cover=sage if (row+col)%2 else ivory
        box('Brochure_Front_Cover',(.20,.006,.255),(0,-.016,.1275),cover,.004)
        box('Brochure_Back_Cover',(.20,.006,.255),(0,.016,.1275),cover,.004)
        box('Brochure_Blank_Label',(.12,.002,.075),(0,-.020,.15),paper,.003)
        for obj in set(bpy.context.scene.objects)-before:obj.parent=holder
        holder.location=(x,y+.012,z+.018)
        holder.rotation_euler.x=math.radians(-10)
for obj in list(bpy.context.scene.objects):
    if obj!=root and obj.parent is None:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Blank-map-brochure-stand.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1200
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-5,3))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.65
cam.rotation_euler=(Vector((0,0,1.05))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'map-stand.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Blank-map-brochure-stand.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-noticeboard-v1'/'Office-noticeboard-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Blank-map-brochure-stand.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:
        obj.matrix_world=(Matrix.Translation((-3.90,-.95,.022))@Matrix.Rotation(math.pi/2,4,'Z')@obj.matrix_world)
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-map-brochures-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Blank map frame and brochures placed; game unchanged',
    'map_surface':'Blank cream, no terrain, roads, buildings or labels',
    'brochures':8,'rack_rows':2,'position':[-3.90,-.95,.022],
    'map_insert_mesh':'Blank_Map_Insert','reference':'user map and brochure stand image',
    'pending':['actual village layout','user art review','game integration']},indent=2),encoding='utf-8')
