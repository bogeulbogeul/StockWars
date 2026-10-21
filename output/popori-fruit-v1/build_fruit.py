"""Popori fruit design proposal, standalone model and tree context."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'world-tree-flowerbed-v1/WorldTree-flowerbed.blend'))
scene=bpy.context.scene
for o in list(scene.objects):
    if o.name.startswith(('Luminous_Wish_Seed','Seed_Stem')):
        bpy.data.objects.remove(o,do_unlink=True)
base=[o for o in scene.objects if o.type=='MESH' and o.name!='Plane']

def mat(name,c,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.62
    p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emission
    return m

skin=mat('Popori_Honey_Peach',(.98,.46,.13),.12)
leafmat=mat('Popori_Mint_Calyx',(.16,.42,.26))
light=mat('Popori_Warm_Seams',(1,.78,.34),.8)
stemmat=mat('Popori_Wood_Stem',(.31,.16,.065))

def sphere(name,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True
    o.select_set(False)
    return o

def fruit(origin,s=1):
    before=set(scene.objects)
    x,y,z=origin
    # Five rounded lobes share a single fruit skin, with a gentle tapered base.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=80,ring_count=48,location=origin)
    body=bpy.context.object;body.name='Popori_Five_Lobed_Fruit'
    for v in body.data.vertices:
        a=math.atan2(v.co.y,v.co.x);h=v.co.z
        r=(1+.09*math.cos(5*a))*(.91-.17*h)
        v.co.x*=.42*r*s;v.co.y*=.42*r*s;v.co.z*=.49*s
    body.data.materials.append(skin)
    for p in body.data.polygons:p.use_smooth=True
    body.select_set(False)
    for i in range(5):
        a=(i+.5)*math.tau/5
        c=bpy.data.curves.new('Soft_Luminous_Seam','CURVE');c.dimensions='3D'
        c.bevel_depth=.009*s;c.bevel_resolution=3
        p=c.splines.new('POLY');p.points.add(40)
        for j,q in enumerate(p.points):
            t=.28+(math.pi-.52)*j/40;h=math.cos(t)
            r=.42*(1-.09)*(.91-.17*h)*math.sin(t)*s+.004*s
            q.co=(x+r*math.cos(a),y+r*math.sin(a),z+.49*h*s,1)
        o=bpy.data.objects.new('Warm_Natural_Fruit_Seam',c);scene.collection.objects.link(o);c.materials.append(light)
    for i in range(5):
        a=i*math.tau/5
        o=sphere('Leaf_Calyx',(x+.17*s*math.cos(a),y+.17*s*math.sin(a),z+.39*s),(.23*s,.085*s,.055*s),leafmat)
        o.rotation_euler[2]=a;o.rotation_euler[1]=.30
    sphere('Short_Connected_Stem',(x,y,z+.58*s),(.033*s,.033*s,.16*s),stemmat)
    return list(set(scene.objects)-before)

hero=fruit((0,0,1),1)
for o in hero:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-fruit.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
for o in base:o.hide_render=True
cam=scene.camera;cam.data.ortho_scale=1.9
cam.location=(1.5,-3,1.7);cam.rotation_euler=(Vector((0,0,1.10))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.cycles.samples=32;scene.render.resolution_x=1000;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'fruit-close.png');bpy.ops.render.render(write_still=True)
for o in hero:bpy.data.objects.remove(o,do_unlink=True)
for o in base:o.hide_render=False
allfruit=[]
for x,y,z in [(-2.55,-.48,3.22),(-1.70,-1.08,3.26),(2.62,-.4,3.22),(1.7,-1.03,3.25),(-1.48,-.64,4.40),(1.38,-.65,4.42)]:
    allfruit+=fruit((x,y,z-.22),.44)
for o in base+allfruit:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-tree-fruit.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
cam.location=(0,-12,6.7);cam.data.ortho_scale=8.6
cam.rotation_euler=(Vector((0,0,2.8))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'tree-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-fruit.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'name':'포포리 나무','status':'P1 fruit visual proposal; final design acceptance and game integration pending',
    'design':'Five-lobed honey peach fruit; mint leaf calyx; thin warm luminous natural seams',
    'game_modified':False,'mechanics_added':False
},ensure_ascii=False,indent=2),encoding='utf-8')
