"""Cabinet-top paperwork, plant, tray and binders from the user's reference."""
import bpy
import bmesh
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish,stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('CabinetDecor_Honey',(.56,.35,.16))
sage=material('CabinetDecor_Sage',(.32,.43,.23))
olive=material('CabinetDecor_Olive',(.24,.34,.15))
paper=material('CabinetDecor_Paper',(.93,.88,.74))
cream=material('CabinetDecor_Ceramic',(.89,.83,.68),.40)
soil=material('CabinetDecor_Soil',(.12,.07,.035))
band=material('CabinetDecor_Binding',(.66,.61,.39))

def lathe(name,profile,mat):
    n=64
    verts=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for r,z in profile for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
           for j in range(len(profile)-1) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,mat,0)
    for p in mesh.polygons:p.use_smooth=True
    return obj

def begin(name):
    root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
    return root,set(bpy.context.scene.objects)

def save(root,before,file):
    children=set(bpy.context.scene.objects)-before
    for obj in children:
        obj.parent=root
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
            bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for obj in root.children_recursive:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/file),export_format='GLB',use_selection=True)

root,before=begin('Bound_Documents')
for i in range(3):
    z=.055+i*.085
    box('Document_Paper_Block',(.265,.25,.066),(0,0,z),paper,.006)
    for dz in [-.038,.038]:box('Sage_Folder_Cover',(.29,.27,.012),(0,0,z+dz),sage,.005)
    box('Folder_Binding',(.025,.275,.093),(0,0,z),band,.004)
    box('Folder_Front_Label',(.065,.004,.026),(-.076,-.138,z),paper,.002)
save(root,before,'Bound-documents.glb')

root,before=begin('Small_Potted_Plant')
lathe('Cream_Pot',[(0,0),(.080,0),(.093,.016),(.105,.15),(.109,.17),
    (.106,.18),(.094,.18),(.091,.156),(.074,.024),(0,.024)],cream)
lathe('Soil',[(0,.155),(.091,.155),(.091,.16),(0,.16)],soil)
stroke('Plant_Stem',[(0,0,.16),(0,0,.40)],.008,olive)
for i in range(7):
    a=i*2.399
    r=.065 if i<5 else .027
    center=Vector((r*math.cos(a),r*math.sin(a),.23+i*.028))
    direction=Vector((math.cos(a)*.7,math.sin(a)*.7,.75)).normalized()
    stroke('Leaf_Petiole',[(0,0,center.z-.025),tuple(center)],.0045,olive)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1,location=center)
    obj=bpy.context.object;obj.name='Smooth_Oval_Leaf'
    obj.scale=(.030,.012,.072)
    obj.rotation_euler=direction.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(sage if i%2 else olive)
    for p in obj.data.polygons:p.use_smooth=True
save(root,before,'Small-potted-plant.glb')

root,before=begin('Cabinet_Paper_Tray')
box('Tray_Base',(.36,.31,.022),(0,0,.011),wood,.008)
for x in [-.169,.169]:box('Tray_Side',(.022,.31,.10),(x,0,.061),wood,.008)
box('Tray_Back',(.34,.022,.10),(0,.144,.061),wood,.008)
box('Tray_Front',(.34,.022,.045),(0,-.144,.033),wood,.007)
for i in range(5):box('Loose_Paper',(.30,.25,.005),((i%2)*.004,0,.027+i*.006),paper,.001)
save(root,before,'Cabinet-paper-tray.glb')

root,before=begin('Standing_Files')
for i,(x,h,mat) in enumerate([(-.08,.34,sage),(0,.37,olive),(.08,.33,paper)]):
    box('File_Pages',(.052,.21,h-.025),(x,.01,h/2),paper,.003)
    for dx in [-.032,.032]:box('File_Cover',(.012,.24,h),(x+dx,0,h/2),mat,.003)
    box('File_Spine',(.072,.023,h),(x,-.115,h/2),mat,.005)
    box('Spine_Label',(.034,.003,.057),(x,-.128,h*.68),band,.002)
    box('Spine_Label_Inset',(.023,.002,.035),(x,-.130,h*.68),paper,.001)
save(root,before,'Standing-files.glb')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Cabinet-decor-source.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-walkway-v3'/'Office-walkway-preview.blend'))
placements=[('Bound-documents.glb',(-2.36,2.29,.882)),('Small-potted-plant.glb',(-1.94,2.29,.882)),
            ('Cabinet-paper-tray.glb',(1.94,2.27,.882)),('Standing-files.glb',(2.37,2.30,.882))]
for file,pos in placements:
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/file))
    for obj in set(bpy.context.scene.objects)-before:
        if obj.parent is None:obj.location+=Vector(pos)
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=6.5
cam.location=(2.6,-4.5,4.3)
cam.rotation_euler=(Vector((0,.6,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
scene.render.resolution_x=1100;scene.render.resolution_y=1000
cam.data.ortho_scale=1.45
for name,x in [('left-detail',-2.15),('right-detail',2.15)]:
    cam.location=(x+1.1,.4,2.2)
    cam.rotation_euler=(Vector((x,2.3,1.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-cabinet-decor-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Four decor GLBs and composed previews; game unchanged',
    'placements':placements,'reference':'user cabinet-top image',
    'anna_source':'anna-meshy-short-vest-v5','walkway_layout':'information-walkway-v3',
    'pending':['user art review','game integration']},indent=2),encoding='utf-8')
