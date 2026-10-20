"""Separate sculpted tabletop props and a composed office preview."""
import bpy
import bmesh
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish,stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Props_Honey_Wood',(.56,.35,.16))
paper=material('Props_Warm_Paper',(.93,.88,.74))
sage=material('Props_Sage',(.32,.43,.23))
ivory=material('Props_Cream_Ceramic',(.89,.83,.68),.32)
ink=material('Props_Form_Ink',(.26,.31,.22))
brass=material('Props_Brass',(.62,.40,.12),.40)
tea=material('Props_Tea',(.22,.09,.022),.20)

def lathe(name,profile,mat):
    n=96
    verts=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z)
           for r,z in profile for i in range(n)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n
            faces.append((a,b,b+n,a+n))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    finish(obj,mat,0)
    for polygon in mesh.polygons:polygon.use_smooth=True
    return obj

def root(name):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
    return obj,set(bpy.context.scene.objects)

def publish(parent,before,filename):
    children=set(bpy.context.scene.objects)-before
    for obj in children:obj.parent=parent
    bpy.ops.object.select_all(action='DESELECT')
    parent.select_set(True)
    for obj in children:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/filename),export_format='GLB',use_selection=True)
    return parent

tray,before=root('Document_Tray_Set')
box('Tray_Base',(.52,.34,.035),(0,0,.0175),wood,.012)
for x in [-.245,.245]:box('Tray_Side',(.03,.34,.14),(x,0,.085),wood,.012)
box('Tray_Back',(.49,.025,.14),(0,.1575,.085),wood,.010)
for x in [-.16,.16]:box('Tray_Front_Lip',(.17,.025,.07),(x,-.1575,.05),wood,.010)
box('Tray_Front_Low_Lip',(.17,.025,.032),(0,-.1575,.032),wood,.008)
for i in range(6):
    obj=box('Stacked_Application_Sheet',(.416,.26,.006),((i%2)*.004,0,.039+i*.007),paper,.001)
    obj.rotation_euler.z=(i%3-1)*.012
publish(tray,before,'Document-tray.glb')

form,before=root('Application_Form_Set')
box('Sage_Writing_Mat',(.62,.40,.012),(0,0,.006),sage,.018)
box('Application_Paper',(.51,.33,.006),(-.025,0,.015),paper,.002)
# Discrete raised lines, no illegible pseudo-writing or baked image texture.
for i,length in enumerate([.22,.40,.40,.28,.40]):
    box('Printed_Form_Line',(length,.003,.001),(-.025,.10-i*.045,.0186),ink,0)
box('Signature_Field',(.27,.003,.001),(-.04,-.116,.0186),sage,0)
box('Paper_Header_Seal',(.035,.028,.001),(-.225,.115,.019),sage,.003)
stroke('Wood_Pen',[(.272,-.125,.026),(.272,.09,.026)],.010,wood)
stroke('Pen_Brass_Tip',[(.272,-.15,.026),(.272,-.125,.026)],.005,brass)
stroke('Pen_Brass_Band',[(.272,.055,.026),(.272,.067,.026)],.0105,brass)
publish(form,before,'Application-form-pen.glb')

cup,before=root('Sprout_Teacup_Set')
lathe('Ceramic_Saucer',[(0,.008),(.08,.008),(.15,.018),(.17,.034),(.169,.046),
    (.15,.040),(.09,.023),(0,.023)],ivory)
lathe('Hollow_Ceramic_Cup',[(0,.027),(.067,.027),(.082,.045),(.096,.15),
    (.098,.185),(.094,.192),(.085,.19),(.083,.154),(.067,.055),(0,.055)],ivory)
# Tea sits below the rim; the cup has a real inner wall.
lathe('Tea_Surface',[(0,.158),(.081,.158),(.081,.16),(0,.16)],tea)
points=[]
for i in range(49):
    a=2*math.pi*i/48
    points.append((.109+.050*math.cos(a),0,.116+.049*math.sin(a)))
stroke('Loop_Handle',points,.012,ivory)
stroke('Cup_Sprout_Stem',[(0,-.093,.074),(0,-.098,.119)],.004,sage)
for x,z,ang in [(-.018,.119,-.65),(.018,.13,.65)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=(x,-.097,z))
    obj=bpy.context.object;obj.name='Cup_Sprout_Leaf'
    obj.scale=(.011,.003,.021);obj.rotation_euler.y=ang
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(sage)
    for p in obj.data.polygons:p.use_smooth=True
publish(cup,before,'Sprout-teacup.glb')

# Replace curve objects with meshes for predictable engine imports.
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
for parent,filename in [(tray,'Document-tray.glb'),(form,'Application-form-pen.glb'),(cup,'Sprout-teacup.glb')]:
    bpy.ops.object.select_all(action='DESELECT');parent.select_set(True)
    for obj in parent.children_recursive:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/filename),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Desk-props-source.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-desk-v1'/'Room-desk-chair-preview.blend'))
positions=[('Document-tray.glb',(-.91,.97,.992)),('Application-form-pen.glb',(0,.92,.992)),
           ('Sprout-teacup.glb',(.95,.92,.992))]
for filename,position in positions:
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/filename))
    for obj in set(bpy.context.scene.objects)-before:
        if obj.parent is None:obj.location+=Vector(position)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=3.65
cam.location=(3,-4,3.6)
cam.rotation_euler=(Vector((0,.92,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'desk-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-desk-props-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Three separate prop GLBs and desk/room previews; game integration pending',
    'props':['Document-tray.glb','Application-form-pen.glb','Sprout-teacup.glb'],
    'tabletop_world_height':.992,'positions':positions,
    'features':['stacked sheets','form lines and signature field','wood pen with brass tip',
                'hollow cup','tea surface below rim','loop handle','raised sprout emblem'],
    'source_units':'same temporary office units','game_changed':False
},indent=2),encoding='utf-8')
