"""Rounded cream planter with tiered broad leaves beside the waiting sofa."""
import bpy
import bmesh
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('FloorPlant_Cream_Ceramic',(.89,.83,.68),.42)
soil=material('FloorPlant_Recessed_Soil',(.13,.085,.04))
greens=[material('FloorPlant_Leaf_'+str(i),c) for i,c in enumerate([
    (.24,.35,.14),(.30,.41,.19),(.35,.45,.22)])]
def surface(name,verts,faces,mat):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    return obj
def lathe(name,profile,mat):
    n=96
    verts=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for r,z in profile for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(profile)-1) for i in range(n)]
    return surface(name,verts,faces,mat)
lathe('Bulbous_Cream_Planter',[(0,0),(.13,0),(.175,.015),(.213,.07),(.229,.16),
    (.222,.27),(.197,.35),(.188,.38),(.19,.405),(.185,.42),(.165,.42),
    (.160,.40),(.164,.375),(.175,.34),(.197,.265),(.20,.16),(.18,.085),(.12,.03),(0,.03)],cream)
lathe('Soil_Surface',[(0,.365),(.172,.365),(.172,.37),(0,.37)],soil)
stroke('Main_Stem',[(0,0,.37),(.012,0,.65),(0,0,.95),(.02,.01,1.20)],.014,greens[0])
for i in range(12):
    tier=i//4;a=2*math.pi*(i%4)/4+tier*.82
    base=Vector((.008,0,.53+tier*.235))
    tilt=math.radians(63-tier*13)
    direction=Vector((math.cos(a)*math.sin(tilt),math.sin(a)*math.sin(tilt),math.cos(tilt)))
    across=Vector((-math.sin(a),math.cos(a),0));normal=across.cross(direction).normalized()
    length=.34 if tier<2 else .32;width=.085 if tier<2 else .082
    verts=[];faces=[];rings=26;sides=16
    for j in range(rings+1):
        t=j/rings;envelope=max(.0008,math.sin(math.pi*t)**.63)
        center=base+direction*(length*t)+normal*(.025*math.sin(math.pi*t))
        for k in range(sides):
            q=2*math.pi*k/sides
            p=center+across*(width*envelope*math.cos(q))+normal*(.011*envelope*math.sin(q))
            verts.append(tuple(p))
    for j in range(rings):
        for k in range(sides):
            x=j*sides+k;y=j*sides+(k+1)%sides;faces.append((x,y,y+sides,x+sides))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple(range(rings*sides,(rings+1)*sides))])
    surface('Tiered_Oval_Leaf_'+str(i),verts,faces,greens[i%3])
for obj in list(bpy.context.scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
root=bpy.data.objects.new('Information_Floor_Plant',None);bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj!=root:obj.parent=root
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Cream-floor-plant.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1200
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Floor',(200,200,.01),(0,0,-.015),material('Preview_Wood',(.60,.40,.21)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.65))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-4,2))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.60
cam.rotation_euler=(Vector((0,0,.64))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'plant.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Cream-floor-plant.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'office-sofa-two-seated-v1'/'Office-sofa-two-seated-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Cream-floor-plant.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((3.24,.30,.022))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=4.1;cam.location=(.35,-4.1,2.9)
cam.rotation_euler=(Vector((2.65,-.9,.90))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'waiting-corner.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-floor-plant-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Floor plant produced and placed; game unchanged',
    'position':[3.24,.30,.022],'leaf_count':12,'features':['rounded hollow cream pot','recessed soil','three leaf tiers'],
    'pending':['user art review','full movement collision','game integration']},indent=2),encoding='utf-8')
