"""Ancient tiered world-tree study; v1 and game files stay intact."""
from pathlib import Path
import math
import json
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
source = (ROOT.parent/'world-tree-clean-v1/build_world_tree.py').read_text(encoding='utf-8')
# Reuse the established curve and matte-material helpers without running v1.
exec(source[source.index('def material'):source.index('trunk_parts =')])
bpy.ops.wm.read_factory_settings(use_empty=True)
wood = material('Ancient_Honey_Wood',(.30,.135,.052))
foliage = [material('Jade_Leaf_'+str(i),c) for i,c in enumerate([
    (.10,.31,.20),(.15,.39,.24),(.23,.46,.26),(.32,.53,.29)])]
gold = material('Warm_Wish_Light',(.95,.63,.16))
p = gold.node_tree.nodes.get('Principled BSDF')
p.inputs['Emission Color'].default_value = (1,.57,.12,1)
p.inputs['Emission Strength'].default_value = .8

parts = []
parts.append(limb('Ancient_Core',[(0,0,.25),(-.12,.05,1.1),(.12,.08,2.1),(-.12,.12,3.1),(.12,.10,4.2),(.06,.1,5.2)], [.83,.66,.53,.41,.26,.05]))
for i in range(9):
    a = i*math.tau/9+.12
    x,y = math.cos(a),math.sin(a)
    parts.append(limb('Wide_Buttress_Root',[(.22*x,.22*y,.65),(.65*x,.65*y,.40),(1.25*x,1.25*y,.18),(1.95*x,1.95*y,.045)],[.43,.34,.18,.018]))
# Twisting structural ribs give age and character without rough bark textures.
for i in range(5):
    pts=[]
    for j in range(7):
        z=.18+j*.53
        a=i*math.tau/5+j*.22
        r=.64-j*.052
        pts.append((r*math.cos(a),r*math.sin(a),z))
    parts.append(limb('Spiralling_Trunk_Rib',pts,[.24,.22,.19,.17,.15,.12,.06]))
branches = [
    ([(-.05,0,1.8),(-.9,0,2.4),(-1.9,.08,2.7),(-2.65,.12,3.25)],[.40,.30,.19,.05]),
    ([(.1,0,2.0),(1.0,-.04,2.5),(1.9,-.1,2.75),(2.70,-.08,3.30)],[.38,.29,.18,.05]),
    ([(-.05,0,2.9),(-.65,.10,3.6),(-1.3,.12,3.95),(-1.85,.1,4.35)],[.30,.23,.14,.04]),
    ([(.1,.10,3.3),(.80,.15,3.85),(1.5,.12,4.15),(1.85,.08,4.55)],[.28,.20,.12,.04]),
    ([(0,.1,2.1),(-.35,1,2.8),(-.8,1.7,3.5)],[.32,.23,.05]),
    ([(0,.1,3.3),(.1,.7,4.1),(.3,1.2,4.6)],[.24,.16,.04])]
for pts, radii in branches:
    parts.append(limb('Spreading_Ancient_Branch',pts,radii))
for o in parts:
    o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join()
trunk=bpy.context.object
trunk.name='Unified_Ancient_Wood'
m=trunk.modifiers.new('Fuse_Wood','REMESH')
m.mode='VOXEL';m.voxel_size=.038
bpy.ops.object.modifier_apply(modifier=m.name)
m=trunk.modifiers.new('Polished_Curves','SMOOTH')
m.factor=1.1;m.iterations=5
bpy.ops.object.modifier_apply(modifier=m.name)
for p in trunk.data.polygons:p.use_smooth=True
trunk.select_set(False)

def mass(name,loc,scale,mat,seed=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc)
    o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        n=v.co.normalized();a=math.atan2(n.y,n.x)
        v.co*=1+.065*math.sin(a*6+seed)*(1-n.z*n.z)
    o.scale=scale;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    o.select_set(False)
    return o

# Three distinct terraces leave the old branching architecture visible.
for tier,z,rx,ry,count in [(0,3.48,2.20,1.25,8),(1,4.64,1.55,.90,7),(2,5.58,.65,.45,5)]:
    for i in range(count):
        a=i*math.tau/count+.2*tier
        mass('Tier_'+str(tier)+'_Crown',
             (rx*math.cos(a),ry*math.sin(a),z+.13*math.sin(a*3)),
             (1.12 if tier==0 else .98 if tier==1 else .82,
              .85 if tier==0 else .76 if tier==1 else .64,
              .43 if tier==0 else .46 if tier==1 else .53),
             foliage[(tier+i%2)%4],i)
    mass('Crown_Centre',(0,.12,z+.17),(rx+.35,ry+.25,.50),foliage[min(3,tier+1)])

# A few luminous seed pods attached beneath the canopy; decorative proposal only.
for i,(x,y,z) in enumerate([(-2.55,-.48,3.22),(-1.70,-1.08,3.26),(2.62,-.4,3.22),
                           (1.7,-1.03,3.25),(-1.48,-.64,4.40),(1.38,-.65,4.42)]):
    stem=limb('Seed_Stem',[(x,y,z+.23),(x,y,z-.12)],[.018,.012])
    pod=mass('Luminous_Wish_Seed',(x,y,z-.26),(.11,.11,.20),gold)
    for v in pod.data.vertices:
        if v.co.z>0:v.co.x*=1-.35*v.co.z;v.co.y*=1-.35*v.co.z

assets=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in assets:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'WorldTree-ancient.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.mesh.primitive_plane_add(size=200)
bpy.context.object.data.materials.append(material('Studio_Ground',(.72,.74,.77)))
for loc,power,size in [((-5,-6,10),1100,6),((5,3,8),700,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,2.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=8.2;scene.camera=cam
for name,loc in [('front',(0,-12,6.2)),('front-right',(7,-12,7)),('rear',(7,12,7))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,2.9))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'WorldTree-ancient.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'P1 visual proposal; final art acceptance and game integration pending',
    'design':'Ancient spiralling wood, buttress roots, three tiered jade crowns, six warm luminous seed pods',
    'seed_pods':'Decorative visual proposal; no growth, reward or story mechanic added',
    'game_modified':False,'mesh_count':len(assets),
    'polygon_count':sum(len(o.data.polygons) for o in assets),
    'reference':'output/world-tree-clean-v1/front.png'
},indent=2),encoding='utf-8')
