"""Add a low circular flower bed around the v2 world tree, preserving its meshes."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'world-tree-clean-v2/WorldTree-ancient.blend'))
scene=bpy.context.scene
tree=[o for o in scene.objects if o.type=='MESH' and o.name!='Plane']
original={o.name:len(o.data.vertices) for o in tree}
bpy.ops.object.select_all(action='DESELECT')

def mat(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=.86
    return m

stone=mat('Flowerbed_Cream_Stone',(.76,.66,.49))
soil=mat('Flowerbed_Soft_Earth',(.19,.105,.052))
green=mat('Flowerbed_Leaf_Green',(.17,.33,.105))
petals=[mat('Flower_Ivory',(.97,.88,.64)),mat('Flower_Lilac',(.54,.36,.66)),mat('Flower_Blush',(.82,.41,.43))]
center=mat('Flower_Golden_Centre',(.95,.57,.12))
added=[]

def finish(o,name,m):
    o.name=name;o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True
    o.select_set(False);added.append(o)
    return o

def sphere(name,loc,scale,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=loc)
    o=bpy.context.object;o.scale=scale
    return finish(o,name,m)

# Shallow earth and rounded wedge stones sit below the root shoulders.
# The root tips taper above z=0. A continuous soil surface at z=.12
# embeds the tapered undersides instead of leaving a visible air gap.
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=2.58,depth=.15,location=(0,0,.045))
finish(bpy.context.object,'Low_Circular_Earth',soil)
for i in range(28):
    a0=i*math.tau/28+.009;a1=(i+1)*math.tau/28-.009
    verts=[]
    for z in [0,.23]:
        for r in [2.52,2.83]:
            for j in range(9):
                a=a0+(a1-a0)*j/8;verts.append((r*math.cos(a),r*math.sin(a),z))
    faces=[]
    for j in range(8):
        faces.extend([(j,j+1,10+j,9+j),(18+j,27+j,28+j,19+j),
                      (j,18+j,19+j,j+1),(9+j,10+j,28+j,27+j)])
    faces.extend([(0,9,27,18),(8,26,35,17)])
    mesh=bpy.data.meshes.new('Curved_Stone');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Border_Stone',mesh);bpy.context.collection.objects.link(o)
    finish(o,'Rounded_Cream_Border_'+str(i),stone)
    bevel=o.modifiers.new('Soft_Stone_Edges','BEVEL');bevel.width=.045;bevel.segments=3
    normal=o.modifiers.new('Stone_Normals','WEIGHTED_NORMAL')

# Small groups leave the central roots and front centre legible.
for group in range(12):
    a=group*math.tau/12+.06
    if math.sin(a)<-.92:continue
    for k in range(3):
        angle=a+(k-1)*.08;r=2.22+.11*(k%2)
        x,y=r*math.cos(angle),r*math.sin(angle)
        h=.24+.07*((group+k)%3)
        bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=.018,depth=h,location=(x,y,.12+h/2))
        finish(bpy.context.object,'Flower_Stem',green)
        for side in [-1,1]:
            leaf=sphere('Small_Leaf',(x+side*.065,y,.195+h*.25),(.11,.045,.03),green)
            leaf.rotation_euler[1]=side*-.4;leaf.rotation_euler[2]=a
        for j in range(5):
            t=j*math.tau/5
            p=sphere('Rounded_Flower_Petal',(x+.075*math.cos(t),y+.075*math.sin(t),h+.130),(.084,.049,.032),petals[group%3])
            p.rotation_euler[2]=t
        sphere('Golden_Flower_Centre',(x,y,h+.152),(.046,.046,.027),center)

assert all(len(bpy.data.objects[name].data.vertices)==count for name,count in original.items())
for o in tree+added:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'WorldTree-flowerbed.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
cam=scene.camera;cam.data.ortho_scale=8.6
scene.cycles.samples=24
for name,loc in [('front',(0,-12,6.7)),('front-right',(7,-12,7.4)),('flowerbed-close',(5,-8,7)),('root-contact',(3,-7,.9))]:
    cam.location=loc
    target=(0,0,.3) if name in ('flowerbed-close','root-contact') else (0,0,2.8)
    cam.data.ortho_scale=5.9 if name=='root-contact' else 6.6 if name=='flowerbed-close' else 8.6
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(7,-12,7.4);cam.data.ortho_scale=8.6
cam.rotation_euler=(Vector((0,0,2.8))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'WorldTree-flowerbed.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'P1 model draft; visual approval and game integration pending',
    'base':'output/world-tree-clean-v2/WorldTree-ancient.blend',
    'tree_mesh_vertex_counts_preserved':True,'border_radius':2.83,'border_height':.23,
    'soil_surface_z':.12,'root_contact':'Raised continuous soil embeds tapered root undersides; flowers raised by same .105 offset',
    'design':'Low rounded cream stone ring; ivory, lilac and blush flowers; clear root centre',
    'game_modified':False
},indent=2),encoding='utf-8')
