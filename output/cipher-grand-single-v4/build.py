"""Build adopted single-storey grand brokerage from native geometry."""
import bpy,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'));sys.path.insert(0,str(ROOT))
from exterior_geometry import box,extrude,stroke,disk,finish,material,arch_outline
from roof import hip,central
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-window-logo-v3'/'CipherSecurities-detail-v3.blend'))
scene=bpy.context.scene
blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream'];ivory=bpy.data.materials['Wall_Ivory']
gold=bpy.data.materials['Cipher_Satin_Brass'];glass=bpy.data.materials['Window_Muted_Blue']
# Keep authored door hierarchy, clock pivots and the adopted detail vocabulary.
door=bpy.data.objects['Door_Assembly'];door_set={door,*door.children_recursive}
windows=[o for o in scene.objects if o.name.startswith(('Front_Window_Glass','Window_','Cipher_Logo_'))]
window_templates=[o for o in windows if not o.name.startswith('Cipher_Logo_') and
    sum((o.matrix_world @ Vector(c)).x for c in o.bound_box)/8<-.2]
logos=[o for o in windows if o.name.startswith('Cipher_Logo_')]
clocks=[o for o in scene.objects if o.name.startswith('Clock_') and o.name!='Clock_Dormer']
keep=door_set|set(window_templates)|set(logos)|set(clocks)
for o in list(scene.objects):
    if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
door.scale*=1.50;door.location=(0,-1.02,.30)
bpy.context.view_layer.update()
# Actual opening through central front wall; no wall behind the double doors.
body=box('Grand_Central_Front_Wall',(2.14,.16,1.88),(0,-.91,1.18),ivory,.015)
cut=extrude('Entry_Cutter',[(x*2.7,.30+z*2.7) for x,z in arch_outline(.16,.265)],-1.25,-.70,ivory,0)
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('True_Arched_Entry','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
box('Grand_Rear_Windowless_Wall',(2.14,.14,1.88),(0,.90,1.18),ivory,.015)
box('Grand_Central_Shell',(2.12,1.78,1.98),(0,0,1.22),ivory,.012)
# Cut through shell too, maintaining a real entry recess.
shell=bpy.data.objects['Grand_Central_Shell']
cut=extrude('Shell_Entry_Cutter',[(x*2.7,.30+z*2.7) for x,z in arch_outline(.16,.265)],-1.2,1.0,ivory,0)
bpy.context.view_layer.objects.active=shell
mod=shell.modifiers.new('Entry_Tunnel','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
for side in (-1,1):
    cx=side*2.05
    box('Single_Storey_Wing',(1.98,1.8,1.49),(cx,0,1.025),ivory,.018)
    box('Wing_Foundation',(2.04,1.96,.23),(cx,0,.135),cream,.018)
    box('Wing_Plinth',(2.04,1.94,.14),(cx,0,.315),cream,.012)
    box('Wing_Cornice_Lower',(2.06,1.94,.09),(cx,0,1.79),cream,.010)
    box('Wing_Cornice_Upper',(2.14,2.04,.10),(cx,0,1.875),cream,.010)
    for x in (side*1.13,side*3.0):
        for y in (-.87,.87):
            box('Wing_Corner_Pilaster',(.14,.13,1.43),(x,y,1.08),cream,.009)
            box('Wing_Corner_Foot',(.22,.23,.26),(x,y,.28),cream,.015)
    hip(cx,blue)
box('Central_Foundation',(2.22,2.03,.29),(0,-.025,.155),cream,.02)
box('Portico_Landing',(2.44,.75,.30),(0,-1.18,.15),cream,.015)
for i,(w,d,z,y) in enumerate([(2.72,.30,.20,-1.69),(2.92,.30,.10,-1.96)]):
    box('Grand_Entry_Step',(w,d,z),(0,y,z/2),cream,.015)
for x in (-1.0,-.66,.66,1.0):
    box('Portico_Column_Plinth',(.35,.36,.20),(x,-1.28,.40),cream,.012)
    # Lathed profile forms an uninterrupted column shaft with soft base/capital.
    profile=[(.155,.49),(.155,.53),(.130,.56),(.115,.59),(.108,.64),
             (.103,1.94),(.113,1.98),(.14,2.0),(.14,2.055),(.16,2.07),(.16,2.115)]
    n=64;verts=[(x+r*math.cos(2*math.pi*j/n),-1.28+r*math.sin(2*math.pi*j/n),z) for r,z in profile for j in range(n)]
    faces=[]
    for k in range(len(profile)-1):
        faces += [(k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j) for j in range(n)]
    faces += [tuple(range(n-1,-1,-1)),tuple(range((len(profile)-1)*n,len(profile)*n))]
    mesh=bpy.data.meshes.new('Column');mesh.from_pydata(verts,[],faces)
    o=bpy.data.objects.new('Portico_Column',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.004)
    for p in mesh.polygons:p.use_smooth=len(p.vertices)==4
    box('Portico_Column_Capital',(.33,.34,.10),(x,-1.28,2.12),cream,.01)
central(blue,cream)
for x in (-1.105,1.105):
    box('Central_Continuous_Side_Cornice',(.09,2.59,.12),(x,-.20,2.16),cream,.006)
# Duplicate finished window assemblies onto front and side walls, one row only.
def place_window(target,angle=0):
    origin=Vector((-.77,-.94,.62));scale=1.65
    transform=Matrix.Translation(Vector(target)) @ Matrix.Rotation(angle,4,'Z') @ Matrix.Diagonal((scale,scale,scale,1)) @ Matrix.Translation(-origin)
    for src in window_templates:
        obj=src.copy();obj.data=src.data.copy();bpy.context.collection.objects.link(obj)
        obj.name='Grand_'+src.name;obj.matrix_world=transform @ src.matrix_world
for x in (-2.57,-1.60,1.60,2.57):place_window((x,-.94,.97))
for side in (-1,1):
    for y in (-.43,.43):place_window((side*3.10,y,.97),side*math.pi/2)
for o in window_templates:bpy.data.objects.remove(o,do_unlink=True)
# Glazed fanlight is seated within the existing arched door surround.
r=.400;spring=1.0155
fan=[(-r,spring),(r,spring)]+[(r*math.cos(math.pi*i/64),spring+r*math.sin(math.pi*i/64)) for i in range(1,65)]
extrude('Entry_Arched_Fanlight_Glass',fan,-1.106,-1.083,glass,.004)
stroke('Entry_Fanlight_Arch_Inlay',[(r*math.cos(math.pi*i/64),-1.111,spring+r*math.sin(math.pi*i/64)) for i in range(65)],.008,gold)
box('Entry_Fanlight_Transom',(.815,.029,.029),(0,-1.106,spring),cream,.005)
for angle in (math.pi/4,math.pi/2,3*math.pi/4):
    stroke('Entry_Fanlight_Radial',[(0,-1.114,spring),(r*math.cos(angle),-1.114,spring+r*math.sin(angle))],.007,gold)
for o in door_set:
    if o.type=='MESH' and any(n in o.name.lower() for n in ('handle','pull')):
        o.data.materials.clear();o.data.materials.append(gold)
# Mount logo centrally over the door and clock in the triangular pediment.
for o in logos:
    t=Matrix.Translation((0,-1.055,1.76)) @ Matrix.Diagonal((1.35,1,1.35,1)) @ Matrix.Translation((0,.965,-1.105))
    o.matrix_world=t @ o.matrix_world
for o in clocks:
    o.location+=Vector((0,-.37,.86))
# Add satin brass clock rim without changing either hand pivot or geometry.
stroke('Grand_Clock_Brass_Rim',[(.199*math.cos(t),-1.54,2.51+.199*math.sin(t)) for t in [2*math.pi*i/96 for i in range(97)]],.008,gold)
scene.frame_set(1);bpy.context.view_layer.update()
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
coords=[o.matrix_world @ Vector(c) for o in asset if o.type=='MESH' for c in o.bound_box]
door_coords=[o.matrix_world @ Vector(c) for o in door_set if o.type=='MESH' for c in o.bound_box]
width=max(p.x for p in coords)-min(p.x for p in coords)
door_h=max(p.z for p in door_coords)-min(p.z for p in door_coords)
stats={'width':width,'doorHeight':door_h,'doorBaselineAt370':370*door_h/width,
    'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()}
(ROOT/'measurements.json').write_text(json.dumps(stats,indent=2))
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,7),450,5),((4,1,6),250,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
for name,loc,target,scale in [('front-right',(5,-9,4.6),(0,-.18,1.40),7.6),
    ('front',(0,-9,3.5),(0,-.18,1.40),7.6),('rear',(5,9,4.6),(0,0,1.4),7.6),
    ('portico-detail',(2,-6,3.2),(0,-1.2,1.65),3.2)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-grand.blend'))
