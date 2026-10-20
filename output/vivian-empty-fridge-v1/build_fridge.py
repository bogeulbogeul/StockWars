"""Empty glass-door fridge installed in Vivian's room."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-empty-shelves-v1'/'Room-empty-shelves.blend'))
before=set(bpy.context.scene.objects)
cream=bpy.data.materials['Cream_Plaster']
coral=bpy.data.materials['Coral_Baseboard']
inside=material('Fridge_Interior',(.60,.67,.65))
dark=material('Fridge_Vent_Dark',(.15,.17,.16))
glass=material('Fridge_Clear_Glass',(.68,.83,.85),.12)
bsdf=glass.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Transmission Weight'].default_value=.94
bsdf.inputs['IOR'].default_value=1.45
X,Y=-2.05,2.28

def part(name,size,loc,mat,bevel=.015):
    return box('Fridge_'+name,size,(X+loc[0],Y+loc[1],loc[2]),mat,bevel)

# Hollow construction leaves the empty interior visible through both doors.
part('Coral_Base',(1.48,.91,.24),(0,0,.12),coral,.04)
part('Back',(1.42,.08,1.75),(0,.385,1.11),cream,.02)
for sign in [-1,1]:
    part('Side',(.085,.78,1.76),(sign*.675,0,1.12),cream,.02)
part('Interior_Floor',(1.30,.70,.055),(0,0,.28),inside,.008)
part('Interior_Ceiling',(1.34,.77,.10),(0,0,1.98),cream,.015)
part('Coral_Header',(1.48,.91,.27),(0,0,2.12),coral,.06)
part('Header_Inset',(1.31,.035,.15),(0,-.463,2.11),cream,.025)
for z in [.65,1.04,1.43,1.82]:
    part('Empty_Shelf',(1.28,.64,.024),(0,-.005,z),inside,.005)
    part('Shelf_Front_Edge',(1.28,.025,.035),(0,-.33,z),cream,.004)
for sign in [-1,1]:
    dx=sign*.335
    for edge in [-1,1]:
        part('Door_Vertical_Frame',(.045,.055,1.68),(dx+edge*.315,-.435,1.12),cream,.008)
        part('Door_Horizontal_Frame',(.67,.055,.045),(dx,-.435,1.12+edge*.82),cream,.008)
    part('Door_Clear_Glass',(.582,.012,1.565),(dx,-.433,1.12),glass,.002)
    part('Door_Handle',(.032,.055,.42),(sign*.075,-.49,1.13),cream,.009)
    for z in [.94,1.32]:
        part('Handle_Mount',(.038,.085,.035),(sign*.075,-.465,z),cream,.004)
for z in [.065,.115,.165]:
    part('Vent_Slot',(1.22,.014,.013),(0,-.462,z),dark,.003)
fridge=list(set(bpy.context.scene.objects)-before)
for obj in fridge:
    obj['asset_role']='empty_drinks_fridge'
assert not any(o.name.startswith('Goods_') for o in bpy.context.scene.objects)

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Vivian-empty-fridge.glb',fridge)
export('Room-empty-shelves-fridge.glb',[o for o in bpy.context.scene.objects if o.type in ('MESH','EMPTY')])
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-fridge.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-empty-shelves-fridge.blend'))
cam=scene.camera
cam.location=(.7,-3,3)
cam.rotation_euler=(Vector((X,Y,1.1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=55
scene.render.filepath=str(ROOT/'fridge-detail.png')
bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Empty fridge modeled and placed; game not changed',
    'placement':'Back-left wall, to right of existing left-wall shelves',
    'center':[X,Y,0],'empty_shelves':4,'goods':0,
    'features':['Hollow cream interior','Two clear glass doors','Coral top and base'],
    'validation':'Overview/detail rendered; no Goods_ objects in room'
},indent=2),encoding='utf-8')
