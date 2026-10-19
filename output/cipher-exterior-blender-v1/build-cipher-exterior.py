"""Blue/ivory brokerage exterior: native primitives, no image-to-mesh conversion."""
import bpy
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import material,box,extrude,arch_outline,arch_ring,disk,stroke

OUT=Path('C:/GitHub/StockWars/output/cipher-exterior-blender-v1');OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
ivory=material('Wall_Ivory',(.78,.735,.63))
cream=material('Trim_Cream',(.86,.81,.7))
blue=material('Roof_Blue',(.035,.115,.24))
edge_blue=material('Roof_Edge_Blue',(.025,.075,.145))
glass=material('Window_Muted_Blue',(.10,.20,.29),.55)
clock_ink=material('Clock_Ink',(.05,.085,.12))

# Ground origin, closed one-storey shell, real doorway through front facade.
foundation=box('Foundation',(2.42,1.95,.13),(0,0,.065),cream,.04)
body=box('Facade_Front',(2.3,.12,1.18),(0,-.84,.72),ivory,.025)
box('Wall_Back_NoWindows',(2.3,.12,1.18),(0,.84,.72),ivory,.025)
for sign in [-1,1]:
    box('Wall_Left' if sign<0 else 'Wall_Right',(.12,1.56,1.18),(sign*1.09,0,.72),ivory,.025)
    box('Side_Base_Trim',(.16,1.64,.15),(sign*1.095,0,.205),cream,.015)
box('Back_Base_Trim',(2.3,.16,.15),(0,.845,.205),cream,.015)
for sx in [-1,1]:
    for sy in [-1,1]:
        box('Corner_Base_Block',(.18,.18,.17),(sx*1.095,sy*.845,.215),cream,.015)
for sign in [-1,1]:
    box('Front_Base_Trim',(.76,.16,.15),(sign*.77,-.85,.205),cream,.015)

door_scale=1.8;door_bottom=.13
cut=extrude('Doorway_Cutter',[(x*door_scale,z*door_scale+door_bottom)
    for x,z in arch_outline(.16,.265)],-1.1,-.60,ivory,0)
bpy.context.view_layer.objects.active=body
modifier=body.modifiers.new('True_Entry_Opening','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cut
bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.data.objects.remove(cut,do_unlink=True)

# Use the exact adopted door asset, keeping named hinge pivots and both leaves.
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath='C:/GitHub/StockWars/output/cipher-double-door-v1/Door-double-blue.glb')
added=[o for o in bpy.data.objects if o not in before]
door=bpy.data.objects['Door_Assembly']
door.scale=(door_scale,)*3;door.location=(0,-.91,door_bottom)

# Rounded front windows with bold cream surrounds and simple cross-bars.
for sign in [-1,1]:
    x=sign*.77;bottom=.39;radius=.17;spring=.29
    pane=extrude('Front_Window_Glass',[(x+px,bottom+pz) for px,pz in arch_outline(radius,spring)],-.922,-.89,glass,.007)
    arch_ring('Front_Window_Frame',x,bottom,radius,spring,.047,-.957,-.88,cream)
    box('Window_Sill',(.49,.16,.045),(x,-.929,bottom-.015),cream,.013)
    box('Window_Cross_Vertical',(.023,.022,.40),(x,-.962,bottom+.21),cream,.006)
    box('Window_Cross_Horizontal',(.345,.022,.023),(x,-.965,bottom+.255),cream,.006)

# Solid gables and a clean curved roof with thick blue eaves, no noisy shingles.
for name,ya,yb in [('Front_Gable',-.895,-.77),('Rear_Gable',.77,.895)]:
    top_profile=[(-1.15+2.3*i/48,
        1.34+.74*(math.cos((abs(-1.15+2.3*i/48)/1.34)*math.pi/2)**1.18)-.085) for i in range(49)]
    extrude(name,[(-1.15,1.28),(1.15,1.28)]+list(reversed(top_profile)),ya,yb,ivory,.006)
box('Front_Gable_Join_Trim',(2.3,.055,.04),(0,-.918,1.30),cream,.009)
box('Back_Gable_Join_Trim',(2.3,.055,.04),(0,.918,1.30),cream,.009)
profile=[]
for i in range(49):
    x=-1.34+2.68*i/48
    z=1.34+.74*(math.cos((abs(x)/1.34)*math.pi/2)**1.18)
    profile.append((x,z))
roof=extrude('Roof_Smooth_Blue',profile+[(x,z-.095) for x,z in reversed(profile)],-1.04,1.04,blue,.025)
# Individual front/back fascia trim follows roof curve as clean rounded strokes.
for y in [-1.055,1.055]:
    stroke('Roof_Fascia',[(x,y,z-.045) for x,z in profile],.036,edge_blue)
stroke('Roof_Ridge',[(0,-1.07,2.08),(0,1.07,2.08)],.035,blue)

# Central clock dormer projects through the front roof without moving facade elements.
clock_body=extrude('Clock_Dormer',[(x,z+1.36) for x,z in arch_outline(.235,.29)],-1.13,-.80,cream,.012)
disk('Clock_Blue_Rim',0,-1.151,1.65,.195,.045,blue)
disk('Clock_Face',0,-1.178,1.65,.166,.014,cream)
for i in range(12):
    t=2*math.pi*i/12
    mark=box('Clock_Tick',(.010,.008,.024),(math.sin(t)*.137,-1.191,1.65+math.cos(t)*.137),clock_ink,.003)
    mark.rotation_euler.y=t
stroke('Clock_Hour',[(0,-1.201,1.65),(-.064,-1.201,1.693)],.009,clock_ink)
stroke('Clock_Minute',[(0,-1.206,1.65),(.083,-1.206,1.722)],.006,clock_ink)
disk('Clock_Pin',0,-1.215,1.65,.014,.012,clock_ink)

# A single readable rising-price emblem replaces text.
box('Emblem_Plaque',(.48,.055,.205),(0,-.942,1.105),cream,.035)
for i,height in enumerate([.035,.062,.092]):
    box('Rising_Bar',(.039,.025,height),(-.11+i*.075,-.979,1.067+height/2),blue,.007)
stroke('Rising_Arrow',[(-.13,-.994,1.115),(-.045,-.994,1.154),(.025,-.994,1.142),(.13,-.994,1.19)],.009,blue)
stroke('Arrow_Tip',[(.088,-.994,1.189),(.13,-.994,1.19),(.113,-.994,1.152)],.009,blue)
box('Entry_Step',(.89,.38,.065),(0,-1.08,.065),cream,.025)

asset_objects=list(bpy.context.scene.objects)
# Convert beveled curves before export, keep groups and door pivots intact.
for obj in list(asset_objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
asset_objects=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset_objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'CipherSecurities-exterior.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'CipherSecurities-exterior.blend'))

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1400;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
ground=material('Studio_Ground',(.72,.74,.77))
box('Studio_Ground',(200,200,.01),(0,0,-.015),ground,0)
for location,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=3.65;scene.camera=camera
for name,location in [('front',(0,-7,3)),('front-right',(4,-6,3.5)),('rear',(4,6,3.5))]:
    camera.location=location;camera.rotation_euler=(Vector((0,-.03,1.03))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/f'{name}.png');bpy.ops.render.render(write_still=True)
manifest={'status':'Design model only; existing game model unchanged',
    'style':'Native matte blue/ivory, rounded trim, smooth roof, arch double doors',
    'features':['True arched entry with adopted double-door pivots','Two front arched windows',
        'Round analog clock dormer','Raised rising-price emblem','No rear windows'],
    'mesh_count':sum(o.type=='MESH' for o in asset_objects),
    'triangles':sum(len(p.vertices)-2 for o in asset_objects if o.type=='MESH' for p in o.data.polygons),
    'notes':['Side walls deliberately plain','Clock hands separate but no time update code',
        'No interior scene included','Game footprint/collision and art approval pending']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('EXTERIOR',json.dumps(manifest))
