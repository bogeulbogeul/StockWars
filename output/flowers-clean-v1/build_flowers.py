"""Three rounded matte village flowers with individually connected stems."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material
bpy.ops.wm.read_factory_settings(use_empty=True)
green=material('Flower_Leaf_Green',(.19,.38,.11))
stemmat=material('Flower_Stem_Green',(.14,.30,.075))
colors=[material('Flower_Cream',(.96,.85,.61)),material('Flower_Soft_Yellow',(.95,.68,.24)),material('Flower_Apricot',(.88,.43,.29))]
gold=material('Flower_Warm_Golden_Centre',(.94,.53,.10))

def ellipsoid(name,loc,scale,mat,rotation=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    if rotation is not None:o.rotation_euler=rotation
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def curve(name,points,radii,mat):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=20
    c.bevel_depth=1;c.bevel_resolution=5;c.use_fill_caps=True
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co,r in zip(s.bezier_points,points,radii):
        p.co=co;p.radius=r;p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(mat)

for i,(center,size,tilt) in enumerate([((0,.07,.79),1,-.20),((-.39,-.025,.56),.82,-.35),((.40,-.015,.55),.84,-.28)]):
    p=Vector(center)
    normal=Vector((tilt,-1,.55)).normalized()
    u=Vector((1,0,0));u=(u-normal*u.dot(normal)).normalized()
    v=normal.cross(u).normalized()
    curve('Connected_Curved_Stem',[(i*.035-.035,.05,-.035),(center[0]*.47,.045,.26),tuple(p-normal*.025)], [.035,.027,.024],stemmat)
    for j in range(5):
        a=math.pi/2+j*math.tau/5
        radial=u*math.cos(a)+v*math.sin(a)
        tangent=-u*math.sin(a)+v*math.cos(a)
        rotation=Matrix((radial,tangent,normal)).transposed().to_euler()
        ellipsoid('Rounded_Petal',p+radial*.125*size,(.145*size,.103*size,.043*size),colors[i],rotation)
    rotation=Matrix((u,v,normal)).transposed().to_euler()
    ellipsoid('Soft_Golden_Centre',p+normal*.045*size,(.092*size,.092*size,.046*size),gold,rotation)
    ellipsoid('Green_Calyx',p-normal*.035*size,(.078*size,.078*size,.035*size),green,rotation)

# Leaves rise gently from a buried central base; no separate floating pieces.
for i,a in enumerate([-.30,.55,1.50,2.45,3.30,4.15,5.05]):
    end=Vector((.36*math.cos(a),.26*math.sin(a),.10+.045*(i%2)))
    base=Vector((0,.035,.015))
    mid=(base+end)/2
    direction=(end-base).normalized()
    rot=direction.to_track_quat('X','Z').to_euler()
    ellipsoid('Low_Rounded_Leaf',mid,(.24,.09,.036),green,rot)
    curve('Leaf_Stalk',[tuple(base),tuple(mid),tuple(end*.8)], [.018,.014,.006],stemmat)
assets=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Flowers-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015))
bpy.context.object.data.materials.append(material('Studio_Gray',(.72,.74,.77)))
for loc,power,size in [((-3,-4,5),400,4),((3,2,4),200,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.6;scene.camera=cam
for name,loc in [('front',(0,-5,2)),('front-right',(3,-5,2.6)),('rear',(3,5,2.6))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,.46))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Flowers-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 model draft; user visual review and game integration pending',
    'reference':'output/flower-clump-simple-multiview-v1/front.png',
    'design':'Three cream, soft yellow and apricot flowers; five rounded petals each; low green foliage; continuous stems',
    'game_modified':False},indent=2),encoding='utf-8')
