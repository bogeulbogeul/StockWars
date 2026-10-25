"""Reference-driven facade, stairs, door, glazing and fixed comparison camera."""
import bpy,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from camera_fit import fit
from exterior_geometry import box,extrude,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-roof-edge-v13'/'CipherSecurities-roof-edge.blend'))
scene=bpy.context.scene;cam=scene.camera
scene.render.resolution_x=803;scene.render.resolution_y=675
scene.render.resolution_percentage=100;scene.cycles.samples=24
fit(cam,ROOT/'camera-fit.json')
scene.render.filepath=str(ROOT/'before.png');bpy.ops.render.render(write_still=True)
cream=bpy.data.materials['Trim_Cream'];blue=bpy.data.materials['Roof_Blue']
gold=bpy.data.materials['Cipher_Satin_Brass'];dark=bpy.data.materials['Cipher_Enamel_Navy']

# Reference windows are shorter and more slender than the inherited assemblies.
# Group parts by their shared frame center, preserving each assembly's joins.
for obj in scene.objects:
    if not obj.name.startswith(('Grand_Window','Grand_Front_Window')):continue
    points=[obj.matrix_world@Vector(c) for c in obj.bound_box]
    center=sum(points,Vector())/8
    if abs(center.x)<2.92:
        centers=(-2.57,-1.60,1.60,2.57)
        original=min(centers,key=lambda x:abs(x-center.x))
        destination={-2.57:-2.44,-1.60:-1.75,1.60:1.60,2.57:2.31}[original]
        pivot=Vector((original,-.94,1.00));scale=(.77,1,1.08,1)
        shift=Vector((destination-original,0,0))
    else:
        pivot=Vector((math.copysign(3.10,center.x),math.copysign(.43,center.y),1.00))
        scale=(1,.77,1.08,1);shift=Vector()
    transform=Matrix.Translation(pivot+shift)@Matrix.Diagonal(scale)@Matrix.Translation(-pivot)
    obj.matrix_world=transform@obj.matrix_world

# Larger readable clock face and closer paired inner columns from the reference.
clock_pivot=Vector((0,-1.54,2.51))
clock_transform=Matrix.Translation(clock_pivot)@Matrix.Diagonal((1.27,1,1.27,1))@Matrix.Translation(-clock_pivot)
for obj in scene.objects:
    if obj.name.startswith(('Clock_','Grand_Clock_Brass_Rim')):
        obj.matrix_world=clock_transform@obj.matrix_world

# Reference has long, quiet vertical door panels and straight paired brass pulls.
retire=('Door_Panel_Leaf','Door_Panel_Continuous_Moulding','Door_Recessed_Panel_Inset',
        'Door_Brass_Curved_Pull','Door_Brass_Pull_Mount','Door_Brass_Kick_Plate')
for obj in list(scene.objects):
    if obj.name.startswith(retire):bpy.data.objects.remove(obj,do_unlink=True)
for side,label in [(-1,'Left'),(1,'Right')]:
    x=side*.2135
    box('Reference_Door_Leaf_'+label,(.412,.095,.692),(x,-1.070,.658),blue,.004)
    # A tall fine inset replaces the old pair of squat panels.
    for px in (x-.118,x+.118):
        box('Reference_Door_Vertical_Recess',(.010,.007,.558),(px,-1.122,.657),dark,.002)
    for z in (.378,.936):
        box('Reference_Door_Recess_End',(.246,.007,.010),(x,-1.122,z),dark,.002)
    hx=side*.048
    box('Reference_Straight_Brass_Pull',(.016,.024,.244),(hx,-1.153,.689),gold,.006)
    for z in (.582,.796):
        box('Reference_Brass_Pull_Fixing',(.025,.034,.025),(hx,-1.135,z),gold,.005)

# Gold window divisions with the broad outer cream surround retained.
for obj in scene.objects:
    if obj.name.startswith(('Grand_Window_Lower_Mullion','Grand_Window_Fanlight_Transom','Grand_Window_Fanlight_Radial')):
        obj.data=obj.data.copy();obj.data.materials.clear();obj.data.materials.append(gold)

# Narrow steps framed by solid stepped side cheeks, as in the reference.
for obj in list(scene.objects):
    if obj.name=='Entry_Continuous_Three_Step_Solid':bpy.data.objects.remove(obj,do_unlink=True)
profile=[(-.80,0),(-2.11,0),(-2.11,.10),(-1.83,.10),(-1.83,.20),(-1.55,.20),(-1.55,.30),(-.80,.30)]
obj=extrude('Reference_Continuous_Three_Step',profile,-1.29,1.29,cream,.008)
obj.rotation_euler.z=math.pi/2
for side in (-1,1):
    for ya,yb,z in [(-2.11,-1.83,.19),(-1.83,-1.55,.29),(-1.55,-.80,.39)]:
        box('Reference_Stepped_Stone_Cheek',(.40,yb-ya,z),(side*1.49,(ya+yb)/2,z/2),cream,.012)

# Readable rising chart: reference's thin line rather than the thick source arrow.
for obj in list(scene.objects):
    if obj.name.startswith(('Cipher_Logo_Chart_Bar','Cipher_Logo_Single_Rising_Arrow')):
        bpy.data.objects.remove(obj,do_unlink=True)
# Locate the retained plaque using its evaluated world bounds.
plaque=bpy.data.objects['Cipher_Logo_Navy_Plaque']
corners=[plaque.matrix_world@Vector(c) for c in plaque.bound_box]
cx=sum(p.x for p in corners)/8;cz=sum(p.z for p in corners)/8
y=min(p.y for p in corners)-.009
for i,height in enumerate((.040,.071,.100,.134)):
    box('Reference_Chart_Bar',(.020,.012,height),(cx-.14+i*.075,y,cz-.080+height/2),gold,.002)
stroke('Reference_Rising_Chart_Line',[(cx-.17,y-.006,cz-.027),(cx-.075,y-.006,cz+.052),
       (cx+.015,y-.006,cz+.007),(cx+.160,y-.006,cz+.114)],.009,gold)
stroke('Reference_Chart_Arrowhead',[(cx+.093,y-.006,cz+.110),(cx+.160,y-.006,cz+.114),
       (cx+.157,y-.006,cz+.048)],.009,gold)

# Preserve the reference's stronger blue while keeping the same matte material.
shader=blue.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.018,.085,.185,1)
blue.diffuse_color=(.018,.085,.185,1)
shader.inputs['Roughness'].default_value=.83
shader.inputs['Specular IOR Level'].default_value=.15
glass=bpy.data.materials['Window_Muted_Blue']
glass.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.035,.115,.190,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.48
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
for obj in scene.objects:
    if obj.type=='LIGHT':obj.data.energy*=.70

scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'matched.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-reference-match.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'gameApplied':False,'reference':'approved-reference.png','cameraFit':'camera-fit.json',
    'changed':['window proportions and spacing','clock face scale','door panels and pulls','gold window divisions','stepped cheeks','chart logo','blue material and lighting'],
    'clockNodesPreserved':all(bpy.data.objects.get(n) is not None for n in ('Clock_Hour','Clock_Minute'))},indent=2))
