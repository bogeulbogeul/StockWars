"""Everyday village tree, visually subordinate to the tiered world tree."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
source=(ROOT.parent/'world-tree-clean-v1/build_world_tree.py').read_text(encoding='utf-8')
exec(source[source.index('def material'):source.index('trunk_parts =')])
wood=material('Common_Tree_Warm_Wood',(.35,.17,.065))
greens=[material('Common_Tree_Leaf_'+str(i),c) for i,c in enumerate([
    (.27,.46,.085),(.34,.53,.12),(.39,.57,.15)])]
parts=[limb('Short_Trunk',[(0,0,-.08),(.02,0,.4),(-.045,.02,.94),(0,.03,1.50)],[.25,.21,.16,.09])]
for i in range(5):
    a=i*math.tau/5+.22
    x,y=math.cos(a),math.sin(a)
    parts.append(limb('Small_Grounded_Root',
        [(.08*x,.08*y,.15),(.26*x,.26*y,.075),(.43*x,.43*y,.018),(.53*x,.53*y,-.035)],
        [.14,.105,.055,.018]))
for i in range(3):
    a=i*math.tau/3+.3
    x,y=math.cos(a),math.sin(a)
    parts.append(limb('Small_Branch',[(0,0,.75),(.27*x,.27*y,1.10),(.55*x,.55*y,1.58)],[.14,.10,.025]))
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join()
trunk=bpy.context.object;trunk.name='Grounded_Short_Trunk'
m=trunk.modifiers.new('Unified_Wood','REMESH');m.mode='VOXEL';m.voxel_size=.025
bpy.ops.object.modifier_apply(modifier=m.name)
m=trunk.modifiers.new('Smooth_Wood','SMOOTH');m.factor=1;m.iterations=4
bpy.ops.object.modifier_apply(modifier=m.name)
for p in trunk.data.polygons:p.use_smooth=True
trunk.select_set(False)
# Overlapping lobes form one compact, untiered silhouette.
for i,(loc,scale) in enumerate([
    ((0,.04,1.98),(.80,.70,.79)),
    ((-.54,.03,1.70),(.64,.58,.61)),
    ((.54,.08,1.74),(.65,.59,.64)),
    ((-.27,-.43,1.66),(.64,.50,.56)),
    ((.33,-.37,1.75),(.59,.53,.59)),
    ((.02,.48,1.78),(.70,.51,.61))]):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc)
    o=bpy.context.object;o.name='Rounded_Leaf_Crown_'+str(i);o.scale=scale
    o.data.materials.append(greens[0 if i>2 else i%3])
    for p in o.data.polygons:p.use_smooth=True
    o.select_set(False)
assets=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CommonTree-clean.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
scene=bpy.context.scene;scene.render.engine='CYCLES'
scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.mesh.primitive_plane_add(size=200)
bpy.context.object.data.materials.append(material('Studio_Ground',(.72,.74,.77)))
for loc,power,size in [((-4,-5,7),550,5),((4,2,5),300,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,1.3))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object
cam.data.type='ORTHO';cam.data.ortho_scale=3.65;scene.camera=cam
for name,loc in [('front',(0,-8,3.5)),('front-right',(5,-8,4.3)),('rear',(5,8,4.3))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,1.35))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CommonTree-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'P1 design draft; final user visual review and game integration pending',
    'design':'Compact bright green untiered canopy, short warm matte trunk, five small grounded roots, no magical ornaments',
    'reference':'output/world-tree-clean-v1/front.png',
    'game_modified':False,'mesh_count':len(assets),
    'trunk_base_z':-.08,'polygon_count':sum(len(o.data.polygons) for o in assets)
},indent=2),encoding='utf-8')
