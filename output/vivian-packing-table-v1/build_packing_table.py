"""Install a packing station in the back-right of the current shop model."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-empty-fridge-v1'/'Room-empty-shelves-fridge.blend'))
before=set(bpy.context.scene.objects)
wood=bpy.data.materials['Honey_Wood_Trim']
cream=bpy.data.materials['Cream_Plaster']
coral=bpy.data.materials['Coral_Baseboard']
kraft=material('Packing_Kraft',(.59,.42,.23))
paper=material('Packing_Paper',(.82,.69,.48))
X,Y=2.25,2.22

def part(name,size,loc,mat=wood,bevel=.015):
    return box('Packing_'+name,size,(X+loc[0],Y+loc[1],loc[2]),mat,bevel)

def roll(name,radius,length,loc,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=radius,depth=length,
        location=(X+loc[0],Y+loc[1],loc[2]),rotation=(0,math.pi/2,0))
    obj=bpy.context.object
    obj.name='Packing_'+name
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,mat,.008)

part('Worktop',(2.10,.92,.12),(0,0,1.04),wood,.035)
for sx in [-1,1]:
    for sy in [-1,1]:
        part('Leg',(.12,.12,.98),(sx*.88,sy*.33,.49),wood,.015)
part('Lower_Shelf',(1.90,.75,.075),(0,0,.22),wood,.018)
part('Back_Rail',(1.95,.075,.12),(0,.36,.72),wood,.012)
for sign in [-1,1]:
    part('Roll_Upright',(.09,.12,.69),(sign*.78,.30,1.39),wood,.015)
roll('Roll_Axle',.035,1.75,(0,.30,1.64),wood)
roll('Kraft_Paper_Roll',.14,1.30,(0,.30,1.64),paper)
part('Paper_Feed',(1.28,.018,.27),(0,.18,1.43),paper,.002)
# Ribbon bar and three reels kept on the back-right, leaving work surface clear.
part('Ribbon_Support',(.07,.10,.35),(.87,.28,1.28),wood,.009)
roll('Ribbon_Axle',.018,.39,(.74,.28,1.39),wood)
for i,mat in enumerate([coral,cream,kraft]):
    roll('Ribbon_Reel',.075,.075,(.63+i*.095,.28,1.39),mat)
# Flat packing materials on the lower shelf; no merchandise added.
for i in range(5):
    part('Flat_Paper_Stack',(.68,.48,.023),(-.45,-.02,.275+i*.027),paper,.004)
part('Empty_Supply_Bin',(.58,.48,.30),(.46,0,.41),cream,.02)
part('Bin_Label',(.18,.012,.08),(.46,-.247,.42),coral,.004)
station=list(set(bpy.context.scene.objects)-before)
for obj in station:
    obj['asset_role']='packing_station'
assert not any(o.name.startswith('Goods_') for o in bpy.context.scene.objects)

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Vivian-packing-table.glb',station)
export('Room-with-packing-table.glb',[o for o in bpy.context.scene.objects if o.type in ('MESH','EMPTY')])
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-packing.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-with-packing-table.blend'))
cam=scene.camera
cam.location=(5,-3,3.8)
cam.rotation_euler=(Vector((X,Y,.95))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=55
scene.render.filepath=str(ROOT/'packing-detail.png')
bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Packing station modeled and placed; game not changed',
    'placement':'Back-right wall, to right of checkout counter',
    'center':[X,Y,0],'dimensions':[2.10,.92,1.78],
    'units':'Temporary modeling units',
    'features':['Clear wooden worktop','Paper roll','Ribbon reels','Lower storage shelf'],
    'preserved':['Empty fridge and merchandise shelves','Counter','Wall flower','Central aisle'],
    'validation':'Overview/detail rendered; no merchandise added; gameplay interaction pending'
},indent=2),encoding='utf-8')
