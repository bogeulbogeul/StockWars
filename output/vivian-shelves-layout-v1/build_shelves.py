"""Stocked wall shelving in the current Vivian room, with center aisle clear."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-wall-flower-v1'/'Room-counter-flower.blend'))
before=set(bpy.context.scene.objects)
wood=bpy.data.materials['Honey_Wood_Trim']
cream=bpy.data.materials['Cream_Plaster']
coral=bpy.data.materials['Coral_Baseboard']
green=bpy.data.materials['Counter_Leaf']
blue=material('Goods_Dusty_Blue',(.19,.32,.38))
kraft=material('Goods_Kraft_Paper',(.57,.38,.18))
mustard=material('Goods_Warm_Yellow',(.72,.49,.17))
jar=material('Goods_Jar_Cream',(.86,.79,.61))
colors=[coral,green,blue,mustard]

def cylinder(name,radius,depth,loc,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=depth,location=loc)
    obj=bpy.context.object
    obj.name=name
    return finish(obj,mat,.008)

def shelf(index,cy):
    start=set(bpy.context.scene.objects)
    # Local front faces negative Y; rotate completed unit to face into room (+X).
    box('Shelf_Back', (1.80,.08,1.85),(0,.24,.965),wood,.018)
    for sign in [-1,1]:
        box('Shelf_Rounded_Upright',(.12,.61,1.99),(sign*.88,0,1.015),wood,.045)
    for z in [.12,.66,1.20,1.74]:
        box('Shelf_Plank',(1.80,.64,.075),(0,-.025,z),wood,.018)
        box('Shelf_Front_Lip',(1.72,.035,.07),(0,-.345,z+.035),wood,.008)
    box('Shelf_Coral_Plinth',(1.95,.69,.10),(0,0,.05),coral,.025)
    for row,z in enumerate([.16,.70,1.24]):
        for col in range(6):
            x=-.70+col*.28
            tint=colors[(col+index+row)%len(colors)]
            if row==2 or (row==1 and index==0):
                height=.30 if col%2 else .34
                cylinder('Goods_Jar',.09,height,(x,-.05,z+height/2),jar)
                cylinder('Goods_Colored_Lid',.097,.035,(x,-.05,z+height+.012),tint)
                box('Goods_Jar_Label',(.125,.012,.10),(x,-.142,z+height*.53),tint,.008)
            elif row==0 and index==1:
                box('Goods_Paper_Bag',(.20,.20,.32),(x,-.06,z+.16),kraft,.016)
                box('Goods_Bag_Fold',(.19,.22,.035),(x,-.06,z+.32),kraft,.006)
                box('Goods_Bag_Label',(.10,.012,.12),(x,-.165,z+.16),cream,.005)
            else:
                box('Goods_Box',(.22,.22,.34),(x,-.055,z+.17),tint,.014)
                box('Goods_Box_Label',(.13,.012,.18),(x,-.171,z+.17),cream,.008)
    objects=list(set(bpy.context.scene.objects)-start)
    pivot=bpy.data.objects.new('Shelf_Unit_'+str(index+1),None)
    bpy.context.collection.objects.link(pivot)
    for obj in objects:
        obj.parent=pivot
        obj['asset_role']='stocked_merchandise_shelf'
    pivot.rotation_euler.z=math.pi/2
    pivot.location=(-3.60,cy,0)
    return pivot

shelf(0,-1.35)
shelf(1,.85)
shelves=list(set(bpy.context.scene.objects)-before)

def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)

export('Vivian-stocked-shelves.glb',shelves)
export('Room-counter-flower-shelves.glb',[o for o in bpy.context.scene.objects if o.type in ('MESH','EMPTY')])
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-shelves.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-counter-flower-shelves.blend'))
cam=scene.camera
cam.location=(1,-5,3.5)
cam.rotation_euler=(Vector((-3.3,-.3,1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=45
scene.render.filepath=str(ROOT/'shelves-detail.png')
bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Two stocked shelves modeled and placed; game not changed',
    'placement':'Left wall, facing room center',
    'units':2,'rows_per_unit':3,'products_per_row':6,
    'goods':['Cream jars with colored lids','Boxed goods','Folded kraft paper bags'],
    'preserved':['Counter and back-wall flower','Clear central entrance aisle'],
    'validation':'Overview/detail rendered; movement and interaction not implemented'
},indent=2),encoding='utf-8')
