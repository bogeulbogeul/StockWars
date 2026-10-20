"""Recessed glazed display with a continuous timber surround and bound-book mullions."""
import math
import bpy
from exterior_geometry import box, stroke, material, finish


def rounded_loop(width,height,r):
    points=[]
    for x,z,a in [(width/2-r,height/2-r,0),(-width/2+r,height/2-r,90),
                  (-width/2+r,-height/2+r,180),(width/2-r,-height/2+r,270)]:
        for i in range(17):
            t=math.radians(a+90*i/16)
            points.append((.56+x+r*math.cos(t),.805+z+r*math.sin(t)))
    return points


def surround(name,outer,inner,front,back,mat):
    n=len(outer)
    verts=[(x,y,z) for y in [front,back] for loop in [outer,inner] for x,z in loop]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    # Correct all winding before beveling the closed annulus.
    import bmesh
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    return finish(obj,mat,.007)


def build_display(wood,gold,glass,red,green):
    dark=material('Display_Recess_Shadow',(.075,.052,.033))
    blue=material('Display_Blue_Book',(.075,.17,.23))
    label=material('Display_Book_Label',(.18,.09,.035))
    shader=glass.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value=.29
    shader.inputs['Coat Weight'].default_value=.28
    box('Display_Recess_Back',(1.46,.022,.72),(.56,-.917,.805),dark,.035)
    surround('Display_Continuous_Timber_Frame',rounded_loop(1.60,.86,.10),
             rounded_loop(1.41,.67,.05),-1.005,-.89,wood)
    surround('Display_Inner_Rebate',rounded_loop(1.418,.678,.052),
             rounded_loop(1.375,.635,.035),-.965,-.925,dark)
    box('Display_Recessed_Glass',(1.397,.018,.657),(.56,-.941,.805),glass,.035)
    for x,mat in [(.12,red),(.56,green),(1.0,blue)]:
        # Ends penetrate both rails; front lies just behind the timber face.
        box('Display_Book_Bound_Spine',(.106,.088,.730),(x,-.959,.805),mat,.012)
        for z in [.492,.519,1.091,1.118]:
            box('Display_Book_Wrapped_Band',(.111,.092,.010),(x,-.960,z),gold,.004)
        box('Display_Book_Recessed_Label',(.070,.007,.115),(x,-1.006,.842),label,.009)
        for z in [.803,.881]:
            box('Display_Book_Label_Inlay',(.049,.004,.003),(x,-1.011,z),gold,.001)
        # Small restrained diamond ornament echoes antique gilt bindings.
        stroke('Display_Book_Gilt_Diamond',[(x,-1.012,.825),(x+.012,-1.012,.842),
               (x,-1.012,.859),(x-.012,-1.012,.842),(x,-1.012,.825)],.002,gold)
