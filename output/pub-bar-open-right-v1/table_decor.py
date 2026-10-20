"""Small brass candle lantern and leafy round vase for the pub table."""
import bpy
import math
from mathutils import Vector
from exterior_geometry import material, finish, stroke
from table_geometry import cylinder


def sphere(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
    obj=bpy.context.object
    obj.name=name
    obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(obj,mat,0)
    for face in obj.data.polygons:face.use_smooth=True
    return obj


def build_table_decor(x,y,z):
    brass=material('Table_Lantern_Brass',(.42,.235,.055),.36)
    brass.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.65
    glow=material('Table_Lantern_Warm_Light',(1,.56,.13),.45)
    shader=glow.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value=(1,.40,.055,1)
    shader.inputs['Emission Strength'].default_value=3
    ceramic=material('Table_Vase_Brown',(.095,.043,.018),.38)
    green=material('Table_Plant_Leaf',(.16,.28,.045),.79)
    lightgreen=material('Table_Plant_Light_Leaf',(.26,.39,.070),.80)
    stem=material('Table_Plant_Stem',(.11,.16,.022),.85)
    lx,ly=x-.16,y-.10
    cylinder('Table_Lantern_Base',.083,.025,(lx,ly,z+.0125),brass,.008)
    cylinder('Table_Lantern_Glow',.044,.137,(lx,ly,z+.099),glow,.008)
    for angle in [0,math.pi/2,math.pi,3*math.pi/2]:
        px,py=lx+.061*math.cos(angle),ly+.061*math.sin(angle)
        cylinder('Table_Lantern_Post',.007,.16,(px,py,z+.103),brass,.003)
    cylinder('Table_Lantern_Lid',.079,.024,(lx,ly,z+.192),brass,.007)
    cylinder('Table_Lantern_Handle_Socket',.016,.016,(lx,ly,z+.215),brass,.004)
    # Lower arc passes through the socket body, with both sides entering it.
    # Turn its plane toward the room entrance so the opening stays legible.
    angle=.60
    points=[(lx+.031*math.cos(t)*math.cos(angle),
             ly+.031*math.cos(t)*math.sin(angle),z+.244+.031*math.sin(t))
            for t in [2*math.pi*i/64 for i in range(65)]]
    stroke('Table_Lantern_Closed_Round_Handle',points,.006,brass)
    vx,vy=x+.13,y+.10
    body=sphere('Table_Round_Ceramic_Vase',(vx,vy,z+.092),(.094,.094,.100),ceramic)
    neck=cylinder('Table_Vase_Neck',.042,.065,(vx,vy,z+.193),ceramic,.006)
    # Open mouth and a deep inner well, leaving a visible ceramic rim.
    cutter=cylinder('Vase_Interior_Cutter',.032,.18,(vx,vy,z+.211),ceramic,0)
    for target in [body,neck]:
        bpy.context.view_layer.objects.active=target
        cut=target.modifiers.new('Hollow_Vase_Interior','BOOLEAN')
        cut.operation='DIFFERENCE'
        cut.solver='EXACT'
        cut.object=cutter
        bpy.ops.object.modifier_apply(modifier=cut.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    for i in range(7):
        angle=i*2.40
        height=.31+(i%3)*.047
        end=Vector((vx+.115*math.cos(angle),vy+.115*math.sin(angle),z+height))
        base=Vector((vx,vy,z+.205))
        stroke('Table_Plant_Sprig',[tuple(base),tuple(end)],.004,stem)
        direction=Vector((math.cos(angle),math.sin(angle),.38)).normalized()
        leaf=sphere('Table_Plant_Rounded_Leaf',end+direction*.035,
                    (.032,.012,.074),green if i%2 else lightgreen)
        leaf.rotation_euler=direction.to_track_quat('Z','Y').to_euler()
    bpy.ops.object.light_add(type='POINT',location=(lx,ly,z+.13))
    lamp=bpy.context.object
    lamp.name='Table_Lantern_Preview_Light'
    lamp.data.energy=1.5
    lamp.data.color=(1,.52,.18)
    lamp.data.shadow_soft_size=.065
