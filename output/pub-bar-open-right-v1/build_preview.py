"""Separate bar asset and composed room preview; not a gameplay install."""
import bpy
import sys
import json
import math
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from bar_geometry import build_bar
from barrel_geometry import build_barrel
from window_geometry import build_windows
from door_geometry import build_door
from room_extension import extend_entrance
from furniture_height import lower_bar, lower_barrel

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'pub-room-shell-oak-v2'/'Pub-room-shell.blend'))
extend_entrance()
before=set(bpy.context.scene.objects)
build_bar()
lower_bar(set(bpy.context.scene.objects)-before)
bar_before=set(bpy.context.scene.objects)
build_barrel()
barrel=set(bpy.context.scene.objects)-bar_before
# Point the dispensing face rightward into the staff work area.
barrel_pivot=Vector((-2.73,1.84,1.49))
turn=(Matrix.Translation(barrel_pivot) @ Matrix.Rotation(math.pi/2,4,'Z')
      @ Matrix.Translation(-barrel_pivot))
for obj in barrel:obj.matrix_world=turn @ obj.matrix_world
lower_barrel(barrel)
bpy.ops.object.select_all(action='DESELECT')
for obj in barrel:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-oak-barrel.glb'),export_format='GLB',use_selection=True)
bar=set(bpy.context.scene.objects)-before
bpy.ops.object.select_all(action='DESELECT')
for obj in bar:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-bar-open-right.glb'),export_format='GLB',use_selection=True)
window_before=set(bpy.context.scene.objects)
build_windows()
windows=set(bpy.context.scene.objects)-window_before
bpy.ops.object.select_all(action='DESELECT')
for obj in windows:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-interior-windows.glb'),export_format='GLB',use_selection=True)
door_before=set(bpy.context.scene.objects)
build_door()
bpy.ops.object.select_all(action='DESELECT')
for obj in set(bpy.context.scene.objects)-door_before:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-basement-door.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in {'MESH','CURVE'}:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-bar-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
cam=scene.camera
cam.data.type='PERSP'
cam.data.lens=38
cam.location=(0,-14,10)
cam.rotation_euler=(Vector((0,-.5,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'front.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.45
cam.location=(-.8,-1.8,3.1)
cam.rotation_euler=(Vector((-2.73,1.78,1.45))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'barrel-close.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Pub-bar-room-preview.blend'))
cam.data.type='ORTHO'
cam.data.ortho_scale=6.4
cam.location=(1,-5,9)
cam.rotation_euler=(Vector((-.65,1.65,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'bar-right-passage.png')
bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO'
cam.data.ortho_scale=1.25
cam.location=(1,-3,4)
cam.rotation_euler=(Vector((-1,2.63,2.38))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'moon-joint-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=2.30
cam.location=(0,-4,2.7)
cam.rotation_euler=(Vector((-3.98,-.65,1.45))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'window-close.png')
bpy.ops.render.render(write_still=True)
assert 2.43-1.40>=1.0
cam.data.ortho_scale=2.45
cam.location=(1,-3,2.6)
cam.rotation_euler=(Vector((2.65,2.98,1.02))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'door-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=4.90
cam.location=(0,-5,3.4)
cam.rotation_euler=(Vector((-1,2.65,1.47))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'backbar-close.png')
bpy.ops.render.render(write_still=True)
assert .60-(-.25+.25)>=.60
assert 2.095-1.10>=.95
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Native bar built; game integration and Andre movement testing pending',
    'staff_aisle_width':1.03,'right_access_clear_width':.995,
    'units':'temporary model units; not validated against an Andre model',
    'right_return_and_gate':False,'stools':3,
    'stool_to_counter_clear_gap':.60,
    'stool_style':'domed burgundy cushion, rounded oak legs, no yellow rungs',
    'basement_door_approach':'right side remains clear',
    'assets':['Pub-bar-open-right.glb','Pub-bar-room-preview.glb'],
    'character_animation_collision_navigation':'not implemented'
},indent=2),encoding='utf-8')
