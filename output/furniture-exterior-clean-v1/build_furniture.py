"""Modern Frame: native smooth geometry preserving the existing asymmetric shop."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, stroke, disk

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Furniture_Cream_Walls', (.88, .79, .63))
wood = material('Furniture_Honey_Wood', (.45, .235, .085))
roofmat = material('Furniture_Dark_Brown_Tiles', (.135, .095, .075))
stone = material('Furniture_Smooth_Base', (.62, .54, .43))
glass = material('Furniture_Blue_Gray_Glass', (.22, .34, .40), .5)
gold = material('Furniture_Brass_Handles', (.78, .49, .13))
chairmat = material('Furniture_Chair_Emblem_Cream', (.94, .73, .39))

# Recess only the right side of the wall and continuous stone plinth.
# Left boundary stays fixed; corner posts and their stone feet stay in place.
box('Foundation', (3.59, 2.00, .19), (-.045, 0, .095), stone, .04)
box('Smooth_Walls_Windowless_Back', (3.43, 1.85, 1.34), (-.045, 0, .85), cream, .002)
# One uninterrupted front beam across both building volumes.
box('Front_Wood_Beam', (3.79, .11, .115), (.085, -1.045, 1.3975), wood, .004)
box('Rear_Wood_Beam', (3.62, .13, .12), (0, .94, 1.46), wood, .018)
for x in [-1.70, -.25, 1.70]:
    # Sink the timber slightly into the stone cap to close the bevel seam.
    box('Front_Timber_Post', (.12, .18, 1.065), (x, -.98, .8975), wood, .012)
    box('Post_Smooth_Foot', (.23, .23, .38), (x, -.98, .19), stone, .025)
for x in [-1.70, 1.70]:
    box('Rear_Timber_Post', (.12, .18, 1.065), (x, .98, .8975), wood, .012)
    box('Post_Smooth_Foot', (.23, .23, .38), (x, .98, .19), stone, .025)
    box('Side_Eaves_Beam', (.13, 1.94, .12), (x, 0, 1.46), wood, .018)

def roof(name, center, halfwidth, base, rise, front, back):
    def height(x):
        return base + rise * max(0, math.cos((x-center)/halfwidth*math.pi/2))**1.25
    profile = [(center-halfwidth+2*halfwidth*i/64, height(center-halfwidth+2*halfwidth*i/64)) for i in range(65)]
    extrude(name+'_Sealed_Roof', profile+[(x,z-.085) for x,z in reversed(profile)], front, back, roofmat, .012)
    for a,b in [(front,front+.055),(back-.055,back)]:
        extrude(name+'_Honey_Edge',[(x,z-.065) for x,z in profile]+[(x,z-.15) for x,z in reversed(profile)],a,b,wood,.008)
    columns=12
    for i in range(columns):
        xa=center-halfwidth+2*halfwidth*i/columns
        curve=[(xa+2*halfwidth/columns*k/6,height(xa+2*halfwidth/columns*k/6)+.014) for k in range(7)]
        for j in range(7):
            ya=front+(back-front)*j/7
            extrude(name+'_Rounded_Tile',curve+[(x,z-.03) for x,z in reversed(curve)],ya,ya+(back-front)/7-.008,roofmat,.009)
    for a,b,label in [(front+.10,front+.16,'Front'),(back-.16,back-.10,'Rear_NoWindows')]:
        inner=[(x,z-.10) for x,z in profile if abs(x-center)<halfwidth-.13]
        extrude(name+'_'+label+'_Gable',[(center-halfwidth+.13,base-.075),(center+halfwidth-.13,base-.075)]+list(reversed(inner)),a,b,cream,.008)

# Main ridge runs front to back; right showroom wing has its ridge across the shop.
roof('Main', -.94, 1.02, 1.51, .79, -1.10, 1.10)
before=set(bpy.context.scene.objects)
roof('Showroom', 0, 1.07, 1.51, .43, -.98, 1.12)
wing=set(bpy.context.scene.objects)-before
for obj in wing:
    # Rotate the wing so its end gable faces right, like the source model.
    obj.rotation_euler.z=math.pi/2
    obj.location.x=1.01
    if obj.name.startswith('Showroom_Front_Gable'):
        # Right-facing gable was at X=1.89; align it with the recessed wall X=1.67.
        obj.location.x-=.22

# Continuous honey fascia under the showroom's front and rear eaves.
# Ends overlap the curved side trim, closing the exposed cream strip and joint.
for y in [1.045]:
    box('Showroom_Continuous_Wood_Fascia', (2.26,.11,.115), (.85,y,1.3975), wood, .004)
# Trim the descending main-roof tail at the horizontal fascia's top plane.
cut=box('Temporary_Miter_Cut',(.55,2.40,.40),(.025,0,1.255),wood,0)
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Main_Honey_Edge','Main_Sealed_Roof','Main_Rounded_Tile')):
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Flush_Fascia_Intersection','BOOLEAN')
        mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
        bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cut,do_unlink=True)
# The showroom roof must start at the main roof tip, not extend beneath it.
cut=box('Temporary_Intersecting_Wing_End', (2.16,3.0,3.0), (-1.0,0,1.5),wood,0)
for obj in wing:
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Remove_Overlapping_Wing_End','BOOLEAN')
    mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
    bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cut,do_unlink=True)
# Fuse the fascia and curved edge trims so overlapping ends leave no cap seams.
trim_parts=[o for o in bpy.context.scene.objects if
            o.name.startswith(('Showroom_Continuous_Wood_Fascia','Showroom_Honey_Edge','Main_Honey_Edge','Front_Wood_Beam'))]
trim=trim_parts[0]
for other in trim_parts[1:]:
    bpy.context.view_layer.objects.active=trim
    mod=trim.modifiers.new('Continuous_Eaves_Join','BOOLEAN')
    mod.operation='UNION';mod.solver='EXACT';mod.object=other
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(other,do_unlink=True)

doorx=-.90
box('Entry_Step', (1.04, .35, .16), (doorx, -1.03, .08), stone, .018)
box('Entry_Lower_Step', (1.16, .28, .08), (doorx, -1.285, .04), stone, .018)
door_before=set(bpy.context.scene.objects)
radius=.34
gap=.005
for side in [-1,1]:
    angle=math.acos(gap/radius)
    contour=[(doorx+side*gap,.18),(doorx+side*radius,.18),(doorx+side*radius,.91)]
    contour += [(doorx+side*radius*math.cos(angle*i/48),.91+radius*math.sin(angle*i/48)) for i in range(1,49)]
    leaf=extrude('Entry_Double_Door_Leaf',contour,-.995,-.93,wood,.004)
    # Glazing is inset into an actual cut opening in each wooden leaf.
    cx=doorx+side*.171
    rr=.130
    pane=[(cx-rr,.66),(cx+rr,.66),(cx+rr,.92)]
    pane += [(cx+rr*math.cos(math.pi*i/32),.92+rr*math.sin(math.pi*i/32)) for i in range(1,33)]
    cutter=extrude('Temporary_Glass_Cutter',pane,-1.04,-.90,wood,0)
    bpy.context.view_layer.objects.active=leaf
    mod=leaf.modifiers.new('Inset_Glass_Opening','BOOLEAN')
    mod.operation='DIFFERENCE';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    extrude('Door_Inset_Glass',pane,-.982,-.945,glass,.003)
    box('Door_Lower_Panel',(.255,.016,.28),(cx,-1.001,.36),wood,.018)
    x=doorx+side*.067
    points=[]
    for i in range(17):
        t=math.pi/2*i/16
        points.append((x,-1.004-.038*math.sin(t),.46+.020*(1-math.cos(t))))
    points.append((x,-1.042,.59))
    for i in range(1,17):
        t=math.pi/2*i/16
        points.append((x,-1.004-.038*math.cos(t),.59+.020*math.sin(t)))
    stroke('Brass_Door_Pull',points,.010,gold)
    for z in [.46,.61]:
        disk('Brass_Handle_Mount',x,-1.004,z,.018,.012,gold)
arch_ring('Door_Cream_Arch',doorx,.15,.34,.76,.075,-1.025,-.92,cream)
for obj in set(bpy.context.scene.objects)-door_before:
    # Clear the foundation face while retaining the original doorway height.
    obj.location.y-=.018

# Small front-left and right-side windows removed at user request.
# Showroom window: wide rounded rectangle and recessed vertical mullions.
def rounded_rect(cx,cz,w,h,r):
    points=[]
    for x,z,start in [(cx+w/2-r,cz+h/2-r,0),(cx-w/2+r,cz+h/2-r,90),(cx-w/2+r,cz-h/2+r,180),(cx+w/2-r,cz-h/2+r,270)]:
        for i in range(13):
            t=math.radians(start+90*i/12)
            points.append((x+r*math.cos(t),z+r*math.sin(t)))
    return points
cx,cz=.76,.85
# Compensate the facade's later X scaling so all four bezel sides stay equal.
def window_contour(w,h,r):
    return [(cx+(x-cx)/1.15,z) for x,z in rounded_rect(cx,cz,w,h,r)]
outer_w,outer_h,corner,border=1.72,.76,.15,.06
inner_w,inner_h=outer_w-2*border,outer_h-2*border
frame=extrude('Showroom_Rounded_Wood_Frame',window_contour(outer_w,outer_h,corner),-1.015,-.932,wood,0)
cutter=extrude('Temporary_Showroom_Opening',window_contour(inner_w,inner_h,corner-border),-1.05,-.90,wood,0)
bpy.context.view_layer.objects.active=frame
mod=frame.modifiers.new('Real_Recessed_Window_Opening','BOOLEAN')
mod.operation='DIFFERENCE';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
mod=frame.modifiers.new('Soft_Uniform_Bezel','BEVEL');mod.width=.004;mod.segments=3
bpy.ops.object.modifier_apply(modifier=mod.name)
extrude('Showroom_Inset_Blue_Glass',window_contour(inner_w+.012,inner_h+.012,corner-border),-.951,-.937,glass,.002)
for dx in [-.48,.48]:
    box('Showroom_Inset_Mullion',(.028/1.15,.030,inner_h+.025),(cx+dx/1.15,-.966,cz),wood,.003)

# House-shaped plaque and a compact cream armchair emblem, preserving shop identity.
signx=-.94
outline=[(signx-.29,1.56),(signx+.29,1.56),(signx+.29,1.91),(signx,2.145),(signx-.29,1.91)]
# Back face overlaps the gable: a mounted wooden plaque rather than a floating sign.
extrude('Chair_House_Plaque',outline,-1.035,-.985,wood,.012)
insetmat=material('Sign_Warm_Walnut_Inset',(.25,.115,.040))
inset=[(signx-.252,1.596),(signx+.252,1.596),(signx+.252,1.894),(signx,2.099),(signx-.252,1.894)]
extrude('Plaque_Recessed_Walnut_Field',inset,-1.037,-1.025,insetmat,.010)
# The solid plaque itself forms one continuous rim; no overlapping edge rods.
def soft_sign_box(name,size,loc,mat,radius):
    obj=box(name,size,loc,mat,0)
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Smooth_Upholstery_Roundover','BEVEL')
    mod.width=radius;mod.segments=12
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for face in obj.data.polygons: face.use_smooth=True
    mod=obj.modifiers.new('Soft_Surface_Normals','WEIGHTED_NORMAL')
    mod.keep_sharp=True;mod.weight=50
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj
soft_sign_box('Chair_Emblem_Back',(.232,.065,.255),(signx,-1.068,1.858),chairmat,.030)
soft_sign_box('Chair_Emblem_Back_Cushion',(.184,.038,.193),(signx,-1.104,1.867),chairmat,.018)
soft_sign_box('Chair_Emblem_Seat',(.25,.080,.075),(signx,-1.098,1.713),chairmat,.034)
for dx in [-.139,.139]:
    soft_sign_box('Chair_Emblem_Arm',(.062,.085,.135),(signx+dx,-1.089,1.759),chairmat,.030)
    soft_sign_box('Chair_Emblem_Leg',(.035,.036,.080),(signx+dx*.79,-1.075,1.650),wood,.006)

asset=list(bpy.context.scene.objects)
# Widen the whole facade in world X, preserving height and depth.
for obj in asset:
    obj.matrix_world = Matrix.Diagonal((1.15, 1, 1, 1)) @ obj.matrix_world
bpy.ops.object.select_all(action='DESELECT')
for obj in asset: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Furniture-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1200
scene.render.resolution_y=1000
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Preview_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-3,-4,6),350,5),((4,1,5),200,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.35
scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    if '--join-review' in sys.argv and name!='front-right':
        continue
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,1.1))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=.85
target=Vector((-.10,-1.04,1.50))
cam.location=target+Vector((2,-6,2.2))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'eaves-joint-close.png')
bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=.95
target=Vector((signx*1.15,-1.04,1.85))
cam.location=target+Vector((1,-6,1.1))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'sign-close.png')
if '--join-review' not in sys.argv:
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Furniture-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Model produced; user art review pending','reference':'output/building-retouch-final/FunitueStoreBuilding-after.png','rear':'windowless','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')
