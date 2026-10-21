"""Raised sprout wall medallion matching the supplied reference."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Mark_Honey_Wood',(.56,.35,.16))
cream=material('Mark_Cream_Face',(.89,.83,.68))
green=material('Mark_Sprout_Green',(.32,.43,.23))
disk('Round_Wood_Backing',0,0,0,.43,.07,wood)
disk('Inset_Cream_Face',0,-.041,0,.372,.018,cream)
bpy.ops.mesh.primitive_torus_add(major_radius=.397,minor_radius=.031,
    major_segments=96,minor_segments=16,location=(0,-.054,0),rotation=(math.pi/2,0,0))
rim=bpy.context.object;rim.name='Continuous_Rounded_Wood_Rim'
rim.data.materials.append(wood)
for p in rim.data.polygons:p.use_smooth=True
stroke('Sprout_Rounded_Stem',[(0,-.069,-.235),(0,-.070,-.10),(.015,-.071,.005),(.062,-.071,.11)],.023,green)
for name,center,scale,angle in [
    ('Left_Oval_Leaf',(-.105,-.082,.046),(.086,.024,.140),-.65),
    ('Right_Oval_Leaf',(.113,-.082,.075),(.086,.024,.150),.65)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=1,location=center)
    obj=bpy.context.object;obj.name=name;obj.scale=scale;obj.rotation_euler.y=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(green)
    for p in obj.data.polygons:p.use_smooth=True
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
root=bpy.data.objects.new('Information_Sprout_Wall_Mark',None)
bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj!=root:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-sprout-wall-mark.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Wall',(200,.03,200),(0,.06,0),material('Preview_Cream',(.84,.77,.64)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,-2,3),150,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.5,-4,.5))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.10
cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'mark.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-sprout-wall-mark.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-potted-plant-v2'/'Office-plant-v2-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Information-sprout-wall-mark.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((0,2.955,2.03))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=6.5;cam.location=(2.6,-4.5,4.3)
cam.rotation_euler=(Vector((0,.7,1.0))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-wall-mark-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'3D wall mark produced; review pending',
    'diameter':.86,'position':[0,2.955,2.03],'units':'temporary office modeling units',
    'features':['rounded wood rim','cream inset','raised stem and two leaves'],
    'plant_version':'information-potted-plant-v2','anna_version':'anna-meshy-short-vest-v5',
    'game_changed':False},indent=2),encoding='utf-8')
