"""Small native Blender primitives for the brokerage exterior."""
import bpy
import bmesh
import math

def material(name,color,roughness=.85):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF')
    s.inputs['Base Color'].default_value=(*color,1)
    s.inputs['Roughness'].default_value=roughness
    return m

def finish(obj,mat,bevel=.015):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj
    if bevel:
        mod=obj.modifiers.new('Soft_Edges','BEVEL');mod.width=bevel;mod.segments=3
        mod.harden_normals=True;bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=obj.modifiers.new('Planar_Normals','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def box(name,size,loc,mat,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,mat,bevel)

def extrude(name,contour,yfront,yback,mat,bevel=.008):
    n=len(contour);vertices=[(x,y,z) for y in [yfront,yback] for x,z in contour]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    return finish(o,mat,bevel)

def arch_outline(radius,spring,bottom=0,steps=32):
    return [(-radius,bottom),(radius,bottom),(radius,spring)]+[
        (radius*math.cos(math.pi*i/steps),spring+radius*math.sin(math.pi*i/steps)) for i in range(1,steps+1)]

def arch_ring(name,x,bottom,radius,spring,width,yfront,yback,mat):
    n=33;verts=[]
    for y in [yfront,yback]:
        for r in [radius,radius+width]:
            verts += [(x+r*math.cos(math.pi*i/(n-1)),y,bottom+spring+r*math.sin(math.pi*i/(n-1))) for i in range(n)]
    faces=[]
    for i in range(n-1):
        faces += [(i,i+1,n+i+1,n+i),(2*n+i,3*n+i,3*n+i+1,2*n+i+1),
                  (i,2*n+i,2*n+i+1,i+1),(n+i,n+i+1,3*n+i+1,3*n+i)]
    faces += [(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,mat,.006)
    for sign in [-1,1]:
        box(name+'_Jamb',(width,yback-yfront,spring),(x+sign*(radius+width/2),(yfront+yback)/2,bottom+spring/2),mat,.006)
    return o

def disk(name,x,y,z,radius,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=depth,
        location=(x,y,z),rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name=name
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,mat,.005)

def stroke(name,points,radius,mat):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=1
    data.bevel_depth=radius;data.bevel_resolution=3
    data.use_fill_caps=True
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for p,coord in zip(spline.points,points):p.co=(*coord,1)
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj
