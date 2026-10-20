"""Smooth native bank, preserving golden roof, coin sprout and double doors."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, disk, stroke

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Bank_Cream', (.88, .79, .60))
green = material('Bank_Gold_Roof', (.86, .48, .065))
wood = material('Bank_Honey_Wood', (.29, .14, .055))
stone = material('Bank_Smooth_Base', (.67, .57, .42))
glass = material('Bank_Window_Soft_Blue_Glass', (.32, .52, .61), .45)
glass_shader=glass.node_tree.nodes.get('Principled BSDF')
glass_shader.inputs['Emission Color'].default_value=(.12,.23,.28,1)
glass_shader.inputs['Emission Strength'].default_value=.18
gold = material('Bank_Brass', (.79, .51, .12))
leaf = material('Bank_Sprout', (.27, .43, .14))

box('Foundation', (3.10, 1.97, .16), (0, 0, .08), stone, .04)
box('Smooth_Walls_Windowless_Back', (2.98, 1.84, 1.35), (0, 0, .825), cream, .035)
box('Wood_Fascia', (3.10, 1.94, .10), (0, 0, 1.48), wood, .018)
for x in [-1.43, 1.43]:
    box('Corner_Post', (.10, 1.87, 1.25), (x, 0, .80), cream, .02)
# Rounded semicircular landing, its rear half embedded in the foundation.
for name,r,z,h in [('Entry_Lower_Step',.77,.045,.09),('Entry_Upper_Step',.68,.12,.10)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=r,depth=h,location=(0,-.91,z))
    from exterior_geometry import finish
    finish(bpy.context.object,stone,.025).name=name

def arch(name, x, bottom, r, spring, mat, front=-.955):
    return extrude(name, [(x+a, bottom+b) for a,b in arch_outline(r, spring)], front, front+.035, mat, .008)

# Two actual leaves separated by a narrow seam, inside the continuous arch frame.
gap=.004
radius=.33
arc_end=math.acos(gap/radius)
for side in [-1,1]:
    # Arc ends exactly on the vertical seam: no sliver or tapered center edge.
    contour=[(side*gap,.17),(side*radius,.17),(side*radius,.78)]
    contour += [(side*radius*math.cos(arc_end*i/48),.78+radius*math.sin(arc_end*i/48)) for i in range(1,49)]
    extrude('Central_Double_Door_Leaf',contour,-.965,-.923,wood,.002)
    x=side*.075
    # Matching straight pulls with smooth quarter-circle returns into the door.
    points=[]
    for i in range(13):
        t=math.pi/2*i/12
        points.append((x,-.968-.045*math.sin(t),.505+.025*(1-math.cos(t))))
    points.append((x,-1.013,.645))
    for i in range(1,13):
        t=math.pi/2*i/12
        points.append((x,-.968-.045*math.cos(t),.645+.025*math.sin(t)))
    stroke('Brass_Door_Handle',points,.011,gold)
    for z in [.505,.670]:
        disk('Handle_Mount',x,-.969,z,.019,.012,gold)
arch_ring('Door_Cream_Frame',0,.17,.33,.61,.07,-1.01,-.92,stone)

def window(name, x, side=False):
    before = set(bpy.context.scene.objects)
    arch(name+'_Glass', x, .47, .255, .41, glass)
    arch_ring(name+'_Wood_Frame', x, .47, .255, .41, .044, -.984, -.92, wood)
    box(name+'_Sill', (.65, .13, .065), (x, -.97, .44), stone, .015)
    # Recess the cross into the glazing plane, behind the outer arch frame.
    # One closed cross-shaped solid: no overlapping coplanar front faces.
    half_v=.023/2
    half_h=.023/2
    low,high=.795-.65/2,.795+.65/2
    cross=[(-half_v,low),(half_v,low),
           (half_v,.86-half_h),(.255,.86-half_h),
           (.255,.86+half_h),(half_v,.86+half_h),
           (half_v,high),(-half_v,high),
           (-half_v,.86+half_h),(-.255,.86+half_h),
           (-.255,.86-half_h),(-half_v,.86-half_h)]
    extrude(name+'_Unified_Cross',[(x+a,z) for a,z in cross],-.964,-.952,wood,.003)
    if side:
        pivot = bpy.data.objects.new(name+'_Pivot', None)
        bpy.context.collection.objects.link(pivot)
        for obj in set(bpy.context.scene.objects)-before-{pivot}:
            obj.parent = pivot
        pivot.rotation_euler.z = math.pi/2
        pivot.location.x = .55

window('Front_Left_Window', -.99)
window('Front_Right_Window', .99)
window('Right_Side_Window', 0, True)
for x in [-.51, .51]:
    box('Porch_Post', (.115, .12, 1.03), (x, -1.03, .77), stone, .025)
    # Sink the base into the landing; overlap also closes the bevel seam.
    box('Porch_Post_Base', (.20, .22, .21), (x, -1.03, .225), stone, .025)
    box('Porch_Post_Cap', (.18, .19, .07), (x, -1.03, 1.27), stone, .015)

def roof_height(x):
    return 1.51 + .62 * max(0, math.cos(abs(x)/1.68*math.pi/2))**1.2

profile = [(-1.68+3.36*i/64, roof_height(-1.68+3.36*i/64)) for i in range(65)]
for name, a,b in [('Front_Gable', -.94,-.88), ('Rear_Gable_NoWindows', .88,.94)]:
    top = [(x,z-.06) for x,z in profile if abs(x)<1.50]
    extrude(name, [(-1.49,1.46),(1.49,1.46)]+list(reversed(top)), a,b,cream,.008)
extrude('Sealed_Gold_Roof', profile+[(x,z-.10) for x,z in reversed(profile)], -1.06,1.06,green,.014)
for a,b in [(-1.065,-1.02),(1.02,1.065)]:
    extrude('Wood_Roof_Edge', [(x,z-.085) for x,z in profile]+[(x,z-.14) for x,z in reversed(profile)], a,b,wood,.004)
for i in range(14):
    xa=-1.68+i*.24
    curve=[(xa+.24*k/6,roof_height(xa+.24*k/6)+.018) for k in range(7)]
    for j in range(7):
        extrude('Broad_Green_Tile', curve+[(x,z-.04) for x,z in reversed(curve)], -1.06+j*.303,-1.06+j*.303+.294,green,.009)

# Raised central entrance gable retains the original office silhouette.
crest=[(-.70+1.40*i/128,1.29+.60*math.cos(math.pi*(-.70+1.40*i/128)/1.40))
       for i in range(129)]
extrude('Porch_Cream_Gable', [(-.70,1.27),(.70,1.27)]+list(reversed(crest)), -1.16,-.98,cream,.018)
# Full-depth trim seals the cream backing along both sides and at the tips.
# Extend the green ends into the wood beam instead of leaving an exposed wedge.
beam=[(-.70,1.29),(0,1.37),(.70,1.29)]
extrude('Porch_Wood_Lower_Beam',
        [(x,z-.055) for x,z in beam]+[(x,z+.055) for x,z in reversed(beam)],
        -1.245,-.965,wood,.018)
outer,inner=[],[]
for x,z in crest:
    slope=-.60*math.pi/1.40*math.sin(math.pi*x/1.40)
    normal=Vector((-slope,1)).normalized()
    outer.append((x+.052*normal.x,z+.052*normal.y))
    inner.append((x-.052*normal.x,z-.052*normal.y))
# Trim the curved strip to the beam's exact top and end planes.
# Shared front/back planes remove the protruding brown/gold end blocks.
def clip_polygon(poly, distance):
    result=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        da,db=distance(a),distance(b)
        if da>=0:result.append(a)
        if (da>=0)!=(db>=0):
            low,high=0.,1.
            for _ in range(40):
                t=(low+high)/2
                q=(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]))
                if (distance(q)>=0)==(da>=0):low=t
                else:high=t
            result.append(q)
    return result
trim=outer+list(reversed(inner))
for plane in [lambda p:p[0]+.70,lambda p:.70-p[0],
              lambda p:p[1]-(1.425-.08*abs(p[0])/.70)]:
    trim=clip_polygon(trim,plane)
extrude('Porch_Gold_Curved_Edge',trim,-1.245,-.965,green,.005)
# Medallion back overlaps the gable wall slightly: a mounted plaque, no air gap.
body=disk('Coin_Gold_Rim',0,-1.179,1.64,.185,.040,gold)
face=disk('Coin_Inset_Face',0,-1.201,1.64,.153,.006,green)
# Fuse the plaque first so the engraving has no layered ledges inside it.
def boolean_apply(target,tool,operation):
    bpy.context.view_layer.objects.active=target
    mod=target.modifiers.new('Clean_Solid_Engraving','BOOLEAN')
    mod.operation=operation;mod.solver='EXACT';mod.object=tool
    bpy.ops.object.modifier_apply(modifier=mod.name)
boolean_apply(body,face,'UNION')
bpy.data.objects.remove(face,do_unlink=True)
# All cutter bottoms share one exact plane, including the rounded stem.
contour=[]
for cx,cz,start in [(0,1.544,math.pi),(0,1.645,0)]:
    for i in range(33):
        t=start+math.pi*i/32
        contour.append((cx+.010*math.cos(t),cz+.010*math.sin(t)))
cutter=extrude('Unified_Sprout_Cutter',contour,-1.245,-1.190,gold,0)
for sign in [-1,1]:
    contour=[]
    angle=-sign*.64
    for i in range(96):
        t=2*math.pi*i/96
        x,z=.032*math.cos(t),.061*math.sin(t)
        contour.append((sign*.041+x*math.cos(angle)-z*math.sin(angle),
                        1.675+x*math.sin(angle)+z*math.cos(angle)))
    tool=extrude('Leaf_Cutter',contour,-1.245,-1.190,gold,0)
    boolean_apply(cutter,tool,'UNION')
    bpy.data.objects.remove(tool,do_unlink=True)
boolean_apply(body,cutter,'DIFFERENCE')
bpy.data.objects.remove(cutter,do_unlink=True)
# Preserve flat cavity floors and gently soften only the cut boundary.
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Engraving_Edge_Finish','BEVEL')
mod.width=.0008;mod.segments=3;mod.limit_method='ANGLE'
bpy.ops.object.modifier_apply(modifier=mod.name)
# Entrance wall lamps removed at user request.
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-clean.glb'),export_format='GLB',use_selection=True)
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
    lamp=bpy.context.object
    lamp.data.energy=power
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=4.3
scene.camera=cam
for name,loc in [('front-right',(4,-6,3.5)),('front',(0,-7,2.7)),('rear',(4,6,3.5))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'Model produced; user art review pending','reference':'output/bank-retouch-final/BankBuilding-after.png','style':['home-single-eaves-v6','cipher-exterior-blender-v1'],'rear':'windowless','mesh_count':sum(o.type=='MESH' for o in asset)},indent=2),encoding='utf-8')

for name,target,scale in [('sign-close',(0,-1.18,1.64),.60),('door-close',(0,-1.0,.65),1.18),('roof-joint-close',(1.64,-1.04,1.49),.65),('porch-joint-close',(.65,-1.17,1.36),.60)]:
    target=Vector(target)
    cam.data.ortho_scale=scale
    cam.location=target+Vector((4,-6,2.35))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
