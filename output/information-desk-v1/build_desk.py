"""Rounded registration desk with an open rear knee bay."""
import bpy
import bmesh
import math
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish,disk,stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Desk_Honey_Wood',(.56,.35,.16))
cream=material('Desk_Cream_Panels',(.88,.79,.64))
sage=material('Desk_Sprout_Green',(.32,.43,.23))
seam=material('Desk_Panel_Joints',(.66,.56,.40))

def rounded_slab(name,w,d,r,bottom,h,mat):
    path=[]
    for cx,cy,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),
                        (-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        for i in range(17):
            a=math.radians(start+i*90/16)
            path.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    n=len(path)
    vertices=[(x,y,z) for z in [bottom,bottom+h] for x,y in path]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj,mat,.015)

rounded_slab('Rounded_Wood_Countertop',2.80,1.02,.25,.86,.11,wood)
body=rounded_slab('Cream_Desk_Body',2.58,.86,.21,.10,.76,cream)
plinth=rounded_slab('Wood_Plinth',2.65,.91,.23,.025,.105,wood)
# Rear opening is real empty geometry, not a solid block hidden by the chair.
for target in [body,plinth]:
    # Offset the plinth cut slightly to avoid coplanar faces at the joint.
    bay_width=1.45 if target==body else 1.43
    bay_y=.27 if target==body else .265
    cutter=box('Temporary_Knee_Bay',(bay_width,1.0,.84),(0,bay_y,.42),cream,0)
    bpy.context.view_layer.objects.active=target
    boolean=target.modifiers.new('Open_Rear_Knee_Bay','BOOLEAN')
    boolean.operation='DIFFERENCE'
    boolean.solver='EXACT'
    boolean.object=cutter
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    bevel=target.modifiers.new('Knee_Bay_Soft_Edges','BEVEL')
    bevel.width=.009;bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)

for i in range(-5,6):
    x=i*.19
    if abs(x)>.30:
        box('Front_Panel_Joint',(.006,.008,.65),(x,-.432,.48),seam,.002)
disk('Sprout_Badge_Wood',0,-.455,.49,.225,.045,wood)
disk('Sprout_Badge_Cream',0,-.483,.49,.184,.016,cream)
stroke('Sprout_Stem',[(0,-.5,.37),(0,-.5,.47),(.052,-.5,.56)],.013,sage)
for x,z,angle in [(-.06,.51,-.65),(.068,.55,.65)]:
    obj=disk('Sprout_Leaf',x,-.501,z,.060,.024,sage)
    obj.scale.x=.65;obj.scale.z=1.18;obj.rotation_euler.y=angle
anchor=bpy.data.objects.new('Application_Surface_Anchor',None)
bpy.context.collection.objects.link(anchor)
anchor.location=(0,-.04,.97)
asset=list(bpy.context.scene.objects)
assert all(math.isfinite(c) for o in asset if o.type=='MESH' for v in o.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-desk.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=900
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.72,.76,.80,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.66,.69,.71)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.5))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.65;scene.camera=cam
for name,loc in [('front-right',(3,-5,2.8)),('rear',(3,5,2.8))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,.48))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-desk.blend'))

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'anna-office-chair-v1'/'Room-chair-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Information-desk.glb'))
for o in set(bpy.context.scene.objects)-before:
    if o.parent is None:
        o.location.y+=.92;o.location.z+=.022
bpy.context.scene.render.filepath=str(ROOT/'room-preview.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Room-desk-chair-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Desk produced; user art review and game integration pending',
    'dimensions':[2.80,1.02,.97],'units':'temporary room modeling units',
    'rear_knee_bay_width':1.45,'underside_height':.86,
    'counter_anchor':'Application_Surface_Anchor','counter_height':.97,
    'desk_room_position':[0,.92,.022],'chair_room_position':[0,1.85,.022],
    'seat_to_counter_height':.405,
    'pending':['Anna seated pose clearance','interactive application form','game integration'],
    'props':False,'finite_vertices':True},indent=2),encoding='utf-8')
