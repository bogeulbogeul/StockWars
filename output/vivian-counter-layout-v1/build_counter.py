"""Place the first checkout counter in the approved empty pillar shell."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'basic-pillar-room-v2'/'Room-pillar-shell.blend'))
before=set(bpy.context.scene.objects)
cream=bpy.data.materials['Cream_Plaster']
wood=bpy.data.materials['Honey_Wood_Trim']
coral=bpy.data.materials['Coral_Baseboard']
gold=material('Counter_Flower_Gold',(.87,.57,.12))
green=material('Counter_Leaf',(.25,.39,.10))
dark=material('Terminal_Charcoal',(.055,.065,.07))
screen=material('Terminal_Screen',(.075,.14,.16))
Y=1.15
box('Counter_Cream_Body',(2.65,.82,.92),(0,Y,.46),cream,.055)
box('Counter_Coral_Plinth',(2.74,.91,.16),(0,Y,.08),coral,.035)
box('Counter_Honey_Top',(2.88,1.02,.13),(0,Y,.985),wood,.045)
# Flower faces the entrance (negative Y).
for i in range(5):
    a=math.pi/2+2*math.pi*i/5
    disk('Counter_Flower_Petal',.13*math.cos(a),Y-.435-i*.002,.51+.13*math.sin(a),.105,.025,coral)
disk('Counter_Flower_Center',0,Y-.465,.51,.082,.03,gold)
for sign in [-1,1]:
    leaf=disk('Counter_Flower_Leaf',sign*.18,Y-.435,.34,.08,.02,green)
    leaf.scale.x=1.4
    leaf.scale.z=.6
box('Register_Base',(.40,.29,.045),(-.42,Y+.05,1.075),dark,.018)
box('Register_Stand',(.095,.09,.13),(-.42,Y+.09,1.15),dark,.009)
monitor=box('Register_Monitor',(.46,.055,.30),(-.42,Y+.08,1.32),dark,.018)
monitor.rotation_euler.x=math.radians(-12)
display=box('Register_Display',(.40,.008,.24),(-.42,Y+.112,1.325),screen,.008)
display.rotation_euler.x=math.radians(-12)
box('Payment_Terminal',(.14,.21,.095),(-.08,Y-.18,1.10),dark,.013)
box('Payment_Screen',(.105,.12,.008),(-.08,Y-.20,1.151),screen,.005)
counter=list(set(bpy.context.scene.objects)-before)
for obj in counter:
    obj['asset_role']='checkout_counter'

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Vivian-counter.glb',counter)
room=[o for o in bpy.context.scene.objects if o.type=='MESH']
export('Room-with-counter.glb',room)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-counter.png')
bpy.ops.render.render(write_still=True)
cam=scene.camera
cam.location=(3,-4,3)
cam.rotation_euler=(Vector((0,Y,.55))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=48
scene.render.filepath=str(ROOT/'counter-detail.png')
bpy.ops.render.render(write_still=True)
# Save the room overview as the default camera view.
cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=38
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-with-counter.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Counter modeled and placed in room; game not changed',
    'counter_center':[0,Y,0],'counter_width':2.88,
    'staff_clearance_to_back_wall':3-(Y+.51),
    'units':'Temporary modeling units',
    'features':['Cream body','Coral plinth','Honey wood top','Flower emblem',
                'Register facing staff','Payment terminal facing entrance'],
    'validation':'Studio overview/detail rendered; gameplay collision not connected'
},indent=2),encoding='utf-8')
