"""Native matte pub exterior; original burgundy/cream/timber identity."""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Pub_Cream', (.88,.79,.60))
roof = material('Pub_Burgundy', (.34,.065,.105))
wood = material('Pub_Warm_Timber', (.30,.145,.055))
stone = material('Pub_Smooth_Base', (.67,.57,.42))
glass = material('Pub_Blue_Glass', (.20,.39,.47), .5)
gold = material('Pub_Brass', (.86,.57,.15))
lamp = material('Pub_Warm_Lantern', (.98,.72,.32))
box('Foundation', (3.5,2.12,.17),(0,0,.085),stone,.045)
box('Smooth_Windowless_Back_Walls',(3.36,1.98,1.35),(0,0,.84),cream,.035)
for x in [-1.62,-.58,.58,1.62]:
    box('Timber_Post',(.14,2.02,1.30),(x,0,.82),wood,.018)
box('Timber_Fascia',(3.5,2.08,.11),(0,0,1.49),wood,.018)
for w,d,z,h in [(1.38,.40,.14,.15),(1.55,.28,.045,.09)]:
    box('Entry_Step',(w,d,h),(0,-1.10-(.20 if h<.1 else 0),z),stone,.025)

def arch(name,x,z,r,s,mat,y=-1.018):
    return extrude(name,[(x+a,z+b) for a,b in arch_outline(r,s)],y,y+.035,mat,.008)

def split_door_arch(name,bottom,radius,spring,mat,front,bevel=.003,gap=.006):
    # Two independent leaves with a narrow actual opening, no applied strip.
    leaves=[]
    for side in [-1,1]:
        edge=side*gap
        contour=[(edge,bottom),(side*radius,bottom),
                 (side*radius,bottom+spring)]
        for i in range(1,33):
            a=math.acos(gap/radius)*i/32
            contour.append((side*radius*math.cos(a),
                            bottom+spring+radius*math.sin(a)))
        leaves.append(extrude(name+('_Left' if side<0 else '_Right'),contour,
                front,front+.035,mat,bevel))
    return leaves

door_leaves=split_door_arch('Double_Arch_Door',.20,.40,.57,wood,-1.018)
arch_ring('Door_Frame',0,.20,.40,.57,.055,-1.065,-.99,wood)
glass_leaves=split_door_arch('Door_Blue_Glass',.72,.27,.06,glass,-1.018,0,.026)
# Cut actual openings so flush glazing never shares a coplanar wooden face.
for door,pane in zip(door_leaves,glass_leaves):
    cutter=pane.copy()
    cutter.data=pane.data.copy()
    bpy.context.collection.objects.link(cutter)
    for vertex in cutter.data.vertices:
        vertex.co.y=-1.05 if vertex.co.y < -1.0 else -.96
    bpy.context.view_layer.objects.active=door
    cut=door.modifiers.new('Inset_Glass_Opening','BOOLEAN')
    cut.operation='DIFFERENCE'
    cut.solver='EXACT'
    cut.object=cutter
    bpy.ops.object.modifier_apply(modifier=cut.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
glass_trim=material('Door_Glass_Wood_Trim',(.42,.23,.09))
for pane in glass_leaves:
    side=-1 if pane.name.endswith('Left') else 1
    outline=[(side*.026,.72),(side*.27,.72),(side*.27,.78)]
    outline += [(side*.27*math.cos(math.acos(.026/.27)*i/32),
                 .78+.27*math.sin(math.acos(.026/.27)*i/32)) for i in range(1,33)]
    center=Vector((side*.148,.89))
    inner=[tuple(Vector(p)+(center-Vector(p)).normalized()*.009) for p in outline]
    outer=[tuple(Vector(p)+(Vector(p)-center).normalized()*.011) for p in outline]
    n=len(outline)
    verts=[(x,y,z) for y in [-1.023,-1.012] for loop in [inner,outer] for x,z in loop]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    mesh=bpy.data.meshes.new(pane.name+'_Trim')
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(glass_trim)
    obj=bpy.data.objects.new(pane.name+'_Inset_Trim',mesh)
    bpy.context.collection.objects.link(obj)
for x in [-.18,.18]:
    box('Door_Lower_Panel',(.28,.028,.24),(x,-1.018,.39),wood,.012)
for x in [-.075,.075]:
    # Mount on the flat rail between glazing and lower panels, clear of seams.
    for z in [.555,.665]:
        box('Handle_Mount',(.035,.050,.028),(x,-1.043,z),gold,.009)
    box('Brass_Door_Handle',(.027,.032,.15),(x,-1.079,.610),gold,.012)

def window(name,x,side=False):
    before=set(bpy.context.scene.objects)
    arch(name+'_Glass',x,.47,.38,.35,glass)
    arch_ring(name+'_Frame',x,.47,.38,.35,.045,-1.06,-.99,wood)
    box(name+'_Sill',(.88,.13,.065),(x,-1.04,.445),stone,.014)
    # Retain the diamonds, recessed behind the arch and seated against glazing.
    for slope in [-1,1]:
        for intercept in [.27,.52,.77,1.02,1.27]:
            points=[]
            for i in range(121):
                a=-.38+.76*i/120
                z=intercept+slope*a
                top=.82+math.sqrt(max(0,.38**2-a*a))
                if .47<=z<=top: points.append((x+a,-1.027,z))
            if len(points)>1:
                # Bury closed end caps in the surrounding frame/sill, rather
                # than stopping on the visible inner boundary of the opening.
                direction=(Vector(points[-1])-Vector(points[0])).normalized()
                points[0]=tuple(Vector(points[0])-direction*.040)
                points[-1]=tuple(Vector(points[-1])+direction*.040)
                stroke(name+'_Diamond',points,.010,wood)
    if side:
        pivot=bpy.data.objects.new(name+'_Pivot',None)
        bpy.context.collection.objects.link(pivot)
        for obj in set(bpy.context.scene.objects)-before-{pivot}: obj.parent=pivot
        pivot.rotation_euler.z=math.pi/2
        pivot.location.x=.69

window('Front_Left',-1.10)
window('Front_Right',1.10)
window('Right_Side',0,True)
window('Left_Side',0,True)
# Mirror the second side window assembly to the opposite wall.
bpy.data.objects['Left_Side_Pivot'].rotation_euler.z=-math.pi/2
bpy.data.objects['Left_Side_Pivot'].location.x=-.69

def height(x): return 1.53+.58*max(0,math.cos(abs(x)/1.87*math.pi/2))**1.2
profile=[(-1.87+3.74*i/64,height(-1.87+3.74*i/64)) for i in range(65)]
gable=[(x,z-.07) for x,z in profile if abs(x)<1.68]
for y in [-.99,.93]:
    extrude('Closed_Cream_Gable',[(-1.68,1.48),(1.68,1.48)]+list(reversed(gable)),y,y+.06,cream,.008)
extrude('Sealed_Burgundy_Roof',profile+[(x,z-.11) for x,z in reversed(profile)],-1.16,1.16,roof,.015)
for y in [-1.18,1.12]:
    extrude('Timber_Roof_Edge',[(x,z-.06) for x,z in profile]+[(x,z-.15) for x,z in reversed(profile)],y,y+.06,wood,.012)
for i in range(16):
    xa=-1.87+3.74*i/16
    curve=[(xa+3.74/16*k/6,height(xa+3.74/16*k/6)+.014) for k in range(7)]
    for j in range(8):
        extrude('Broad_Burgundy_Tile',curve+[(x,z-.035) for x,z in reversed(curve)],-1.16+j*.29,-1.16+j*.29+.282,roof,.008)
box('Smooth_Chimney',(.29,.30,.70),(-1, .49,2.02),stone,.025)
box('Chimney_Cap',(.39,.40,.09),(-1,.49,2.38),stone,.02)
box('Chimney_Top',(.17,.17,.10),(-1,.49,2.46),wood,.018)
crest=[(-.49,1.525),(.49,1.525),(0,1.845)]
extrude('Entry_Cream_Gable',crest,-1.31,-1.285,cream,.006)
# One closed triangular frame: mitered corners, sealed depth, no round caps.
outer=[(-.66,1.44),(.66,1.44),(0,1.95)]
# Parallel inward offsets give all three rails the same perpendicular width.
rail_width=.080
half_width=.66
rise=1.95-1.44
slope=rise/half_width
offset=rail_width*math.sqrt(1+slope*slope)
inner_peak=1.95-offset
inner_base=1.44+rail_width
inner_half=(inner_peak-inner_base)/slope
inner=[(-inner_half,inner_base),(inner_half,inner_base),(0,inner_peak)]
extrude('Sealed_Timber_Gable_Backing',outer,-1.285,-.97,wood,.008)
verts=[(x,y,z) for y in [-1.35,-1.25] for loop in [outer,inner] for x,z in loop]
faces=[]
for i in range(3):
    j=(i+1)%3
    faces.extend([(i,j,3+j,3+i),(6+i,9+i,9+j,6+j),
                  (i,6+i,6+j,j),(3+i,3+j,9+j,9+i)])
mesh=bpy.data.meshes.new('Unified_Gable_Frame')
mesh.from_pydata(verts,[],faces)
obj=bpy.data.objects.new('Unified_Gable_Frame',mesh)
bpy.context.collection.objects.link(obj)
from exterior_geometry import finish
finish(obj,wood,.009)
# Two intersecting circular arcs share exact tips for a clean crescent.
r,cut_r,offset=.105,.101,.052
tip_x=(r*r-cut_r*cut_r+offset*offset)/(2*offset)
tip_z=math.sqrt(r*r-tip_x*tip_x)
outer_angle=math.acos(tip_x/r)
inner_angle=math.atan2(tip_z,tip_x-offset)
points=[]
for i in range(97):
    t=outer_angle+(2*math.pi-2*outer_angle)*i/96
    points.append((r*math.cos(t),1.67+r*math.sin(t)))
for i in range(1,64):
    t=-inner_angle-(2*math.pi-2*inner_angle)*i/64
    points.append((offset+cut_r*math.cos(t),1.67+cut_r*math.sin(t)))
extrude('Golden_Crescent',points,-1.337,-1.30,gold,.002)
for x in [-.57,.57]:
    box('Lantern_Bracket',(.06,.15,.06),(x,-1.10,1.16),wood,.01)
    box('Lantern_Glass',(.115,.12,.19),(x,-1.17,1.04),lamp,.015)
    for z in [.925,1.155]: box('Lantern_Cap',(.16,.16,.045),(x,-1.17,z),wood,.012)
sign_before=set(bpy.context.scene.objects)
disk('Round_Pub_Sign',1.52,-1.17,.83,.18,.07,wood)
disk('Sign_Brass_Rim',1.52,-1.212,.83,.151,.015,gold)
disk('Sign_Center',1.52,-1.224,.83,.129,.015,wood)
box('Mug_Icon',(.105,.025,.15),(1.50,-1.245,.82),gold,.016)
stroke('Mug_Handle',[(1.55,-1.25,.86),(1.60,-1.25,.86),(1.60,-1.25,.78),(1.55,-1.25,.78)],.014,gold)
foam=material('Pub_Beer_Foam',(.98,.94,.81))
lobes=[(1.469,.902,.019),(1.493,.910,.025),(1.523,.906,.023),(1.536,.899,.014)]
foam_top=[]
for i in range(97):
    x=1.450+.100*i/96
    z=max([cz+math.sqrt(max(0,r*r-(x-cx)**2))
           for cx,cz,r in lobes if abs(x-cx)<=r]+[.890])
    foam_top.append((x,z))
# Match the cup's center/width and front plane, rather than a floating cap.
extrude('Mug_Foam',[(1.450,.874),(1.550,.874)]+list(reversed(foam_top)),
        -1.258,-1.230,foam,.001)
# Keep the raised side placement, with the sign parallel to the front facade.
from mathutils import Matrix
sign_parts=set(bpy.context.scene.objects)-sign_before
sign_origin=Vector((1.52,-1.17,.83))
sign_target=Vector((1.98,-.90,1.04))
turn=Matrix.Identity(4)
transform=Matrix.Translation(sign_target) @ turn @ Matrix.Translation(-sign_origin)
for obj in sign_parts:
    original=obj.matrix_world.copy()
    obj.matrix_world=transform @ original
    if obj.name!='Round_Pub_Sign':
        other=obj.copy()
        other.data=obj.data.copy()
        bpy.context.collection.objects.link(other)
        reflection=Matrix.Identity(4)
        reflection[1][1]=-1
        other.matrix_world=(transform @ Matrix.Translation(sign_origin)
                            @ reflection @ Matrix.Translation(-sign_origin) @ original)
box('Sign_Wall_Plate',(.07,.16,.24),(1.70,-.90,1.14),wood,.014)
box('Sign_Projecting_Bracket',(.48,.055,.055),(1.91,-.90,1.28),wood,.012)
for x in [1.88,2.08]:
    box('Sign_Hanger',(.018,.025,.09),(x,-.90,1.225),gold,.006)
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Pub-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1200
scene.render.resolution_y=1000
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    obj=bpy.context.object
    obj.data.energy=power
    obj.data.size=size
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=4.8
scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,1.15))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Pub-clean.blend'))
# Dedicated close-up checks the icon's alignment at the actual oblique view.
cam.data.ortho_scale=.65
cam.location=sign_target+Vector((4,-6,2.35))
cam.rotation_euler=(sign_target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'sign-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.50
door_target=Vector((0,-1.06,.70))
cam.location=door_target+Vector((2,-7,1.5))
cam.rotation_euler=(door_target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'door-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.08
window_target=Vector((1.10,-1.03,.82))
cam.location=window_target+Vector((4,-6,2.35))
cam.rotation_euler=(window_target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'window-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.65
gable_target=Vector((0,-1.32,1.70))
cam.location=gable_target+Vector((3,-7,2))
cam.rotation_euler=(gable_target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'gable-close.png')
bpy.ops.render.render(write_still=True)
