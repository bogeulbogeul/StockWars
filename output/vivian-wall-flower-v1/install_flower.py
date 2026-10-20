"""Install a native flower emblem on the wall behind Vivian's counter."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import disk
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-counter-layout-v1'/'Room-with-counter.blend'))
before=set(bpy.context.scene.objects)
coral=bpy.data.materials['Coral_Baseboard']
gold=bpy.data.materials['Counter_Flower_Gold']
green=bpy.data.materials['Counter_Leaf']
Z=1.98
for i in range(5):
    angle=math.pi/2+2*math.pi*i/5
    petal=disk('Wall_Flower_Petal',.24*math.cos(angle),2.95-i*.003,
               Z+.24*math.sin(angle),.19,.065,coral)
    petal.scale.z=1.08
disk('Wall_Flower_Gold_Center',0,2.895,Z,.145,.075,gold)
for sign in [-1,1]:
    leaf=disk('Wall_Flower_Leaf',sign*.30,2.95,Z-.30,.14,.045,green)
    leaf.scale.x=1.45
    leaf.scale.z=.60
    leaf.rotation_euler.y=sign*-.30
flower=list(set(bpy.context.scene.objects)-before)
for obj in flower:
    obj['asset_role']='back_wall_flower_emblem'

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Wall-flower.glb',flower)
export('Room-counter-flower.glb',[o for o in bpy.context.scene.objects if o.type=='MESH'])
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-flower.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-counter-flower.blend'))
cam=scene.camera
cam.location=(1,-2,3.2)
cam.rotation_euler=(Vector((0,2.95,Z))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=65
scene.render.filepath=str(ROOT/'flower-detail.png')
bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'3D flower modeled and installed in room; game not changed',
    'placement':'Back wall centered above checkout counter',
    'center':[0,2.95,Z],
    'components':{'coral_petals':5,'gold_center':1,'green_leaves':2},
    'validation':'Room overview and emblem close-up rendered'
},indent=2),encoding='utf-8')
