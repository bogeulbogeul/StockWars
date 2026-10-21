"""Continuous beveled boutique plaque and polished, rounded hanger relief."""
import math
import bpy
from exterior_geometry import material, extrude, arch_outline, stroke


def rounded_path(points, trim=.025):
    result=[]
    for i,p in enumerate(points):
        prev=points[i-1];nxt=points[(i+1)%len(points)]
        def near(q):
            d=math.hypot(q[0]-p[0],q[1]-p[1])
            f=min(trim/d,.35)
            return (p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f)
        a,b=near(prev),near(nxt)
        for j in range(13):
            t=j/12
            result.append(((1-t)**2*a[0]+2*t*(1-t)*p[0]+t*t*b[0],
                           (1-t)**2*a[1]+2*t*(1-t)*p[1]+t*t*b[1]))
    return result+[result[0]]


def build_front_sign(wood):
    enamel=material('Sign_Deep_Teal_Enamel',(.035,.15,.16),.68)
    brass=material('Sign_Satin_Champagne_Brass',(.84,.58,.23),.34)
    shader=brass.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Metallic'].default_value=.55
    def plate(name,r,bottom,spring,front,back,mat,bevel):
        contour=[(x,bottom+z) for x,z in arch_outline(r,spring,steps=96)]
        return extrude(name,contour,front,back,mat,bevel)
    # Full silhouettes give uninterrupted corners and a closed bottom rim.
    plate('Boutique_Single_Wood_Frame',.39,1.605,.12,-1.065,-.938,wood,.012)
    plate('Cream_Hanger_Medallion',.352,1.633,.104,-1.078,-1.055,enamel,.009)
    rim=[(x,1.646+z) for x,z in arch_outline(.337,.091,steps=96)]
    rim=rounded_path(rim,.008)
    stroke('Boutique_Continuous_Brass_Inlay',[(x,-1.086,z) for x,z in rim],.0045,brass)
    # A softly rounded triangular hanger, with uniform thickness and no sharp joints.
    triangle=rounded_path([(-.244,1.723),(.244,1.723),(0,1.875)],.025)
    stroke('Boutique_Rounded_Hanger',[(x,-1.103,z) for x,z in triangle],.011,brass)
    # Tangent-continuous stem into a densely sampled hook, opening to the left.
    pts=[(0,-1.103,1.873),(0,-1.103,1.924)]
    # Smooth S neck joins the bottom of the hook at (0.004, 1.944).
    for i in range(1,17):
        t=i/16
        pts.append((.004*(3*t*t-2*t*t*t),-1.103,1.924+.020*t))
    for i in range(1,81):
        a=-math.pi/2+math.pi*1.5*i/80
        pts.append((.004+.042*math.cos(a),-1.103,1.986+.042*math.sin(a)))
    # Close the small transition gap using a straight vertical segment.
    pts[17:18]=[(.004,-1.103,1.944)]
    hook=stroke('Boutique_Smooth_Hook',pts,.011,brass)
    # Rounded end cap gives the hook a finished tip.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=.011,location=pts[-1])
    cap=bpy.context.object;cap.name='Boutique_Hook_Rounded_Tip';cap.data.materials.append(brass)
    for p in cap.data.polygons:p.use_smooth=True
    # Small botanical accents follow the plaque, leaving the emblem clear.
    for sign in [-1,1]:
        stem=[(sign*(.272+.022*t),-1.098,1.676+.103*t) for t in [i/32 for i in range(33)]]
        stroke('Boutique_Botanical_Stem',stem,.004,brass)
        for x,z,angle in [(.277,1.711,-.55),(.294,1.744,.45)]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=(sign*x,-1.101,z))
            obj=bpy.context.object;obj.name='Boutique_Satin_Leaf'
            obj.scale=(.012,.006,.026);obj.rotation_euler.y=sign*angle
            obj.data.materials.append(brass)
            for p in obj.data.polygons:p.use_smooth=True
