"""Cube-shaped room shell; neutral materials, no furniture or gameplay changes."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box

bpy.ops.wm.read_factory_settings(use_empty=True)
wall = material('Neutral_Cream', (.75, .72, .65))
floor = material('Neutral_Floor', (.59, .56, .49))
# Temporary modeling units: clear interior width = depth = height = 6.
L, T = 6.0, .12
box('Floor', (L+2*T,L+2*T,T), (0,0,-T/2), floor, 0)
box('Wall_Back', (L+2*T,T,L), (0,L/2+T/2,L/2), wall, 0)
box('Wall_Left', (T,L,L), (-L/2-T/2,0,L/2), wall, 0)
box('Wall_Right', (T,L,L), (L/2+T/2,0,L/2), wall, 0)
front = box('Wall_Front', (L+2*T,T,L), (0,-L/2-T/2,L/2), wall, 0)
ceiling = box('Ceiling', (L+2*T,L+2*T,T), (0,0,L+T/2), wall, 0)
asset = list(bpy.context.scene.objects)

def export(name, objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name), export_format='GLB', use_selection=True)

export('Room-cube-full.glb', asset)
export('Room-cube-cutaway.glb', [o for o in asset if o not in (front,ceiling)])
front.hide_render = True
ceiling.hide_render = True
front.hide_set(True)
ceiling.hide_set(True)
scene = bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1200
scene.render.resolution_y=1100
scene.world=bpy.data.worlds.new('Black_Background')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(0,0,0,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0
for loc,power,size in [((0,-4,10),1800,7),((0,1,7),900,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object
    lamp.data.energy=power
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,2))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-13,10))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,2.5))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PERSP'
cam.data.lens=35
scene.camera=cam
scene.render.filepath=str(ROOT/'front-cutaway.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-cube.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Basic geometry only; not installed in game',
    'clear_interior':{'width':L,'depth':L,'height':L},
    'wall_thickness':T,'units':'temporary modeling units, not final game dimensions',
    'full':'Floor, four walls, ceiling',
    'cutaway':'Floor, back wall, left wall, right wall',
    'entrance':'Not cut yet; separate next design step',
    'furniture':False
},indent=2),encoding='utf-8')
