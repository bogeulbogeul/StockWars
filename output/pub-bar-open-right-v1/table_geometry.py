"""Round oak dining table with a single pedestal and rounded circular foot."""
import bpy
import math
from exterior_geometry import material, finish


def cylinder(name,radius,depth,loc,mat,bevel):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=radius,depth=depth,location=loc)
    obj=bpy.context.object
    obj.name=name
    finish(obj,mat,bevel)
    for face in obj.data.polygons:
        if len(face.vertices)==4:face.use_smooth=True
    return obj


def build_table():
    oak=material('Pub_Table_Warm_Oak',(.255,.120,.047),.69)
    dark=material('Pub_Table_Pedestal_Oak',(.145,.058,.020),.74)
    x,y=-1.67,-2.98
    cylinder('Table_Rounded_Circular_Foot',.32,.085,(x,y,.0645),dark,.025)
    cylinder('Table_Foot_Collar',.13,.075,(x,y,.132),dark,.018)
    cylinder('Table_Central_Pedestal',.086,.52,(x,y,.408),dark,.015)
    cylinder('Table_Top_Support',.20,.055,(x,y,.669),dark,.015)
    cylinder('Table_Rounded_Oak_Top',.60,.085,(x,y,.7325),oak,.022)
    # Thin inset joins on the tabletop, clipped to its circular outline.
    joint=material('Pub_Table_Plank_Joint',(.15,.061,.023),.82)
    from exterior_geometry import stroke
    for offset in [-.32,-.10,.12,.34]:
        extent=math.sqrt(.574**2-offset**2)
        stroke('Table_Subtle_Plank_Join',[(x-extent,y+offset,.7752),
               (x+extent,y+offset,.7752)],.0013,joint)
