"""Compact hand-shaped leaf cluster and a rounded cream ceramic pot."""
import bpy
import bmesh
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish

bpy.ops.wm.read_factory_settings(use_empty=True)
cream=material('PlantV2_Cream_Ceramic',(.89,.83,.68),.42)
soil=material('PlantV2_Soil',(.13,.085,.04))
greens=[material('PlantV2_Leaf_'+str(i),c) for i,c in enumerate([
    (.26,.38,.16),(.32,.43,.21),(.36,.46,.23)])]

def mesh_object(name,verts,faces,mat):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    return obj

def lathe(name,profile,mat):
    n=96
    verts=[(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n),z) for r,z in profile for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)
           for j in range(len(profile)-1) for i in range(n)]
    return mesh_object(name,verts,faces,mat)

root=bpy.data.objects.new('Compact_Potted_Plant_V2',None);bpy.context.collection.objects.link(root)
lathe('Rounded_Cream_Pot',[(0,0),(.063,0),(.083,.008),(.100,.03),(.109,.07),
    (.112,.125),(.110,.16),(.106,.17),(.097,.17),(.094,.157),
    (.096,.125),(.092,.065),(.078,.027),(0,.027)],cream)
lathe('Recessed_Soil',[(0,.145),(.096,.145),(.096,.148),(0,.148)],soil)

def leaf(index,angle,tilt,length,width):
    verts=[];faces=[];rings=22;sides=16
    direction=Vector((math.cos(angle)*math.sin(tilt),math.sin(angle)*math.sin(tilt),math.cos(tilt)))
    across=Vector((-math.sin(angle),math.cos(angle),0))
    normal=across.cross(direction).normalized()
    base=Vector((.012*math.cos(angle),.012*math.sin(angle),.142))
    for j in range(rings+1):
        t=j/rings
        # Broad oval paddle with a small rounded tip and a gently cupped face.
        envelope=max(.0008,math.sin(math.pi*t)**.68)
        center=base+direction*(length*t)+normal*(.014*math.sin(math.pi*t))
        for i in range(sides):
            a=2*math.pi*i/sides
            point=center+across*(width*envelope*math.cos(a))+normal*(.009*envelope*math.sin(a))
            verts.append(tuple(point))
    for j in range(rings):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple(range(rings*sides,(rings+1)*sides))])
    mesh_object('Broad_Rounded_Leaf_'+str(index),verts,faces,greens[index%3])

for i in range(6):leaf(i,2*math.pi*i/6+.15,math.radians(48),.175+(i%2)*.016,.048)
for i in range(3):leaf(i+6,2*math.pi*i/3+.7,math.radians(17),.205+(i%2)*.012,.043)
for obj in bpy.context.scene.objects:
    if obj!=root:obj.parent=root
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Small-potted-plant-v2.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.17))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1,-2,1))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.53
cam.rotation_euler=(Vector((0,0,.17))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.filepath=str(ROOT/'plant.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Small-potted-plant-v2.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-cabinet-decor-v1'/'Office-cabinet-decor-preview.blend'))
old=bpy.data.objects.get('Small_Potted_Plant')
assert old
for obj in list(old.children_recursive)+[old]:bpy.data.objects.remove(obj,do_unlink=True)
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Small-potted-plant-v2.glb'))
for obj in set(bpy.context.scene.objects)-before:
    if obj.parent is None:obj.location+=Vector((-1.94,2.29,.882))
scene=bpy.context.scene;cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=1.45
cam.location=(-1.05,.4,2.2)
cam.rotation_euler=(Vector((-2.15,2.3,1.02))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1100;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'cabinet-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-plant-v2-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Native mesh plant redesign; review pending',
    'leaf_count':9,'shape':'compact broad oval cupped leaf cluster','pot':'rounded hollow cream ceramic',
    'reference':'user cabinet decor image','source_and_game_changed':False},indent=2),encoding='utf-8')
