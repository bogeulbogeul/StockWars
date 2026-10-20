"""Rounded backless village bench and Somangi H=1 proportion study."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material
bpy.ops.wm.read_factory_settings(use_empty=True)
# Bring in the current character before designing the furniture.
source=ROOT.parent.parent/'web/assets/characters/3d/somangi/walk.glb'
bpy.ops.import_scene.gltf(filepath=str(source))
character=list(bpy.context.scene.objects)
scene=bpy.context.scene;scene.frame_set(1)
bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in character if o.type=='MESH' for c in o.bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
height=hi.z-lo.z
transform=Matrix.Translation((1.35,0,0))@Matrix.Scale(1/height,4)@Matrix.Translation((-((lo.x+hi.x)/2),-((lo.y+hi.y)/2),-lo.z))
for o in character:
    if o.parent is None:o.matrix_world=transform@o.matrix_world
wood=material('Bench_Smooth_Honey_Wood',(.46,.25,.10))
stone=material('Bench_Smooth_Cream_Stone',(.76,.67,.52))
dark=material('Bench_Lower_Timber',(.35,.18,.065))
bench=[]
def box(name,size,loc,mat,radius):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if radius:
        m=o.modifiers.new('Round_Edges','BEVEL');m.width=radius;m.segments=10
        bpy.ops.object.modifier_apply(modifier=m.name)
    for p in o.data.polygons:p.use_smooth=True
    m=o.modifiers.new('Smooth_Planar_Normals','WEIGHTED_NORMAL');m.keep_sharp=True
    bpy.ops.object.modifier_apply(modifier=m.name)
    bench.append(o)
    return o
# Three closely spaced slats; all sit on two shared timber supports.
for y in [-.155,0,.155]:box('Rounded_Seat_Slat',(1.72,.148,.10),(0,y,.31),wood,.027)
for x in [-.63,.63]:
    box('Solid_Cream_Stone_Leg',(.23,.37,.245),(x,0,.1225),stone,.045)
    box('Seat_Support',(.25,.445,.06),(x,0,.25),wood,.016)
box('Recessed_Lower_Stretcher',(1.26,.11,.10),(0,.035,.205),dark,.018)
bpy.ops.object.select_all(action='DESELECT')
for o in bench:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bench-clean.glb'),export_format='GLB',use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=900
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
ground=box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Studio_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,5),400,4),((3,2,4),200,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
for o in character:o.hide_render=True
for name,loc in [('front',(0,-5,1.8)),('front-right',(3,-5,2.3)),('rear',(3,5,2.3))]:
    cam.location=loc;cam.data.ortho_scale=2.35
    cam.rotation_euler=(Vector((0,0,.23))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
for o in character:o.hide_render=False
cam.location=(2,-5,2.1);cam.data.ortho_scale=3.4
cam.rotation_euler=(Vector((.45,0,.47))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'somangi-scale.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bench-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 model draft; user review, seated contact and game integration pending',
    'reference':'output/backless-bench-multiview-v1/front.png','character_reference':str(source),
    'character_pose':'walk source frame 1, whole unadorned mesh bounds used as body H',
    'source_body_height':height,'normalized_H':1,'bench_width_H':1.72,'bench_depth_H':.458,'seat_top_H':.36,
    'game_modified':False,'seated_contact_verified':False},indent=2),encoding='utf-8')
