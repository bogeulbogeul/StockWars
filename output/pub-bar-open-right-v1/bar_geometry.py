"""Fixed pub bar furniture; the right end has no return or gate."""
import bpy
import math
from mathutils import Vector
from exterior_geometry import material, box, disk, stroke, extrude, finish

def cylinder(name,radius,depth,loc,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc)
    obj=bpy.context.object
    obj.name=name
    return finish(obj,mat,.012)

def build_bar():
    oak=material('Bar_Dark_Oak',(.085,.030,.011),.72)
    panel=material('Bar_Oak_Panels',(.13,.052,.020),.72)
    top=material('Bar_Polished_Oak_Top',(.23,.10,.035),.56)
    brass=material('Bar_Satin_Brass',(.58,.32,.075),.42)
    wine=material('Bar_Burgundy_Seats',(.22,.028,.035),.75)
    # Counter x bounds -3.10..1.10; back edge y=1.40.
    box('Bar_Counter_Body',(4.10,.60,.92),(-1,1,.49),oak,.09)
    box('Bar_Counter_Top',(4.20,.80,.12),(-1,1,1.01),top,.055)
    box('Bar_Counter_Plinth',(4.15,.66,.10),(-1,1,.075),oak,.04)
    for x in [-2.47,-1.81,-1,-.19,.62]:
        box('Counter_Front_Panel',(.46 if x==-2.47 else .72,.025,.64),(x,.687,.51),panel,.025)
    for z in [.15,.87]:
        rail=[(-3.09,2.75),(-3.09,1.00)]
        rail=[(x,y,z) for x,y in rail]
        rail += [(-2.75+.34*math.cos(math.pi+math.pi/2*i/32),
               1.00+.34*math.sin(math.pi+math.pi/2*i/32),z) for i in range(1,33)]
        stroke('Counter_Front_Rail',rail+[(.95,.66,z)],.030,top)
        for endpoint in [(-3.09,2.75,z),(.95,.66,z)]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,
                radius=.030,location=endpoint)
            cap=bpy.context.object
            cap.name='Counter_Rail_Round_End'
            finish(cap,top,0)
            for face in cap.data.polygons:face.use_smooth=True
    # Rear shelf front edge y=2.47. Staff work aisle is 1.07 wide.
    box('Backbar_Lower_Cabinet',(4.10,.40,.92),(-1,2.69,.49),oak,.035)
    for x in [-1.51,-.49,.55]:
        box('Backbar_Cabinet_Door',(.93,.025,.57),(x,2.478,.49),panel,.018)
        disk('Cabinet_Knob',x+.30,2.45,.50,.022,.025,brass)
    box('Backbar_Worktop',(4.20,.46,.12),(-1,2.66,1.01),top,.025)
    # Left-hand return: rounded inner corners, flat continuous countertop.
    def horizontal_return(name,contour,low,high,mat):
        n=len(contour)
        vertices=[(x,y,z) for z in [low,high] for x,y in contour]
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(vertices,[],faces)
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        return finish(obj,mat,.015)
    def u_outline(left,right,front,counter_back,rear_front,rear_back):
        radius=.30
        points=[(left+radius,front),(right,front),(right,counter_back),(-2.10,counter_back)]
        points += [(-2.10+.30*math.cos(-math.pi/2-math.pi/2*i/32),
                    counter_back+.30+.30*math.sin(-math.pi/2-math.pi/2*i/32))
                   for i in range(1,33)]
        points.append((-2.40,rear_front-.30))
        points += [(-2.10+.30*math.cos(math.pi-math.pi/2*i/32),
                    rear_front-.30+.30*math.sin(math.pi-math.pi/2*i/32))
                   for i in range(1,33)]
        points += [(right,rear_front),(right,rear_back),(left,rear_back),(left,front+radius)]
        points += [(left+radius+radius*math.cos(math.pi+math.pi/2*i/32),
                    front+radius+radius*math.sin(math.pi+math.pi/2*i/32)) for i in range(1,32)]
        return points
    for name in ['Bar_Counter_Top','Backbar_Worktop','Bar_Counter_Body','Backbar_Lower_Cabinet','Bar_Counter_Plinth']:
        bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
    horizontal_return('Bar_Counter_Top',u_outline(-3.10,1.10,.60,1.40,2.43,2.89),.95,1.07,top)
    horizontal_return('Bar_Counter_Body',u_outline(-3.05,1.05,.70,1.30,2.49,2.89),.03,.955,oak)
    horizontal_return('Bar_Counter_Plinth',u_outline(-3.08,1.075,.675,1.325,2.465,2.89),.025,.125,oak)
    box('Backbar_Backing',(4.05,.075,1.44),(-1,2.90,1.52),oak,.018)
    for x in [-3.05,1.05]:
        box('Backbar_Pillar',(.21,.34,1.55),(x,2.75,1.54),oak,.035)
        box('Backbar_Pillar_Cap',(.32,.40,.14),(x,2.75,2.31),oak,.028)
        box('Backbar_Pillar_Collar',(.26,.37,.065),(x,2.75,2.20),top,.014)
    for z in [1.76,2.20]:
        box('Backbar_Shelf',(4.10,.37,.075),(-1,2.72,z),top,.018)
    for x in [-1.50,-.50]:
        box('Shelf_Divider',(.095,.32,1.14),(x,2.74,1.64),oak,.018)
    # Three stools remain in front, away from the open right-hand passage.
    for x in [-2.45,-1,.45]:
        stool_y=-.25
        cylinder('Stool_Wood_Seat',.25,.085,(x,stool_y,.60),oak)
        # A soft domed cushion and short rounded legs give a friendly silhouette.
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=1,
            location=(x,stool_y,.665))
        cushion=bpy.context.object
        cushion.name='Stool_Burgundy_Cushion'
        cushion.scale=(.245,.245,.070)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        finish(cushion,wine,0)
        for face in cushion.data.polygons:face.use_smooth=True
        for dx in [-.145,.145]:
            for dy in [-.145,.145]:
                box('Stool_Rounded_Leg',(.085,.085,.55),(x+dx,stool_y+dy,.31),oak,.035)
    # Broad arched oak crown and layered moon medallion match the concept.
    crown=[]
    for i in range(97):
        x=-2.94+3.88*i/96
        z=2.24+.38*math.sqrt(max(0,1-((x+1)/1.94)**2))
        crown.append((x,z))
    # A quad strip keeps the broad arched panel planar with stable normals.
    vertices=[(x,y,z) for y in [2.69,2.89] for x,high in crown for z in [2.20,high]]
    count=len(crown)*2
    faces=[]
    for i in range(len(crown)-1):
        a=2*i
        faces.extend([(a,a+2,a+3,a+1),(count+a,count+a+1,count+a+3,count+a+2),
                      (a,count+a,count+a+2,a+2),(a+1,a+3,count+a+3,count+a+1)])
    faces += [(0,1,count+1,count),(count-2,2*count-2,2*count-1,count-1)]
    mesh=bpy.data.meshes.new('Backbar_Crown_Quads')
    mesh.from_pydata(vertices,[],faces)
    obj=bpy.data.objects.new('Backbar_Arched_Crown',mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,oak,.008)
    vertices=[(x,y,z+offset) for y in [2.64,2.71] for x,z in crown for offset in [-.025,.025]]
    mesh=bpy.data.meshes.new('Backbar_Crown_Trim_Quads')
    mesh.from_pydata(vertices,[],faces)
    obj=bpy.data.objects.new('Backbar_Curved_Crown_Trim',mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,oak,0)
    # Seat the full disk against the backing, without a shadow-catching void.
    disk('Moon_Medallion_Outer',-1,2.72,2.42,.32,.34,oak)
    disk('Moon_Medallion_Rim',-1,2.548,2.42,.279,.018,brass)
    disk('Moon_Medallion_Center',-1,2.536,2.42,.250,.012,top)
    # Remove the shelf surface inside the disk; coplanar faces cause black bands.
    cutter=disk('Moon_Shelf_Cutter',-1,2.70,2.42,.319,.80,oak)
    for shelf in [o for o in bpy.context.scene.objects
                  if o.name.startswith('Backbar_Shelf') and abs(o.location.z-2.20)<.01]:
        bpy.context.view_layer.objects.active=shelf
        cut=shelf.modifiers.new('Fit_Around_Moon','BOOLEAN')
        cut.operation='DIFFERENCE'
        cut.solver='EXACT'
        cut.object=cutter
        bpy.ops.object.modifier_apply(modifier=cut.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    r,ri,d=.186,.178,.096
    tx=(r*r-ri*ri+d*d)/(2*d)
    h=math.sqrt(r*r-tx*tx)
    a=math.acos(tx/r)
    b=math.atan2(h,tx-d)
    points=[(-1+r*math.cos(a+(2*math.pi-2*a)*i/96),
             2.42+r*math.sin(a+(2*math.pi-2*a)*i/96)) for i in range(97)]
    points += [(-1+d+ri*math.cos(-b-(2*math.pi-2*b)*i/64),
                2.42+ri*math.sin(-b-(2*math.pi-2*b)*i/64)) for i in range(1,64)]
    extrude('Backbar_Golden_Moon',points,2.513,2.534,brass,.003)
