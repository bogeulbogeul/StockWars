"""Puffed fabric cushion with tapered corners and a sewn perimeter."""
import bpy
import math
from mathutils import Matrix, Vector
from exterior_geometry import stroke


def build_pillow(loc,mat):
    n=24
    verts=[]
    for side in [-1,1]:
        for j in range(n+1):
            v=-1+2*j/n
            for i in range(n+1):
                u=-1+2*i/n
                puff=max(0,(1-u*u)*(1-v*v))**.65
                verts.append((side*(.009+.095*puff),u*.23,v*.23))
    faces=[]
    stride=(n+1)**2
    for side in range(2):
        for j in range(n):
            for i in range(n):
                a=side*stride+j*(n+1)+i
                face=(a,a+1,a+n+2,a+n+1)
                faces.append(face if side else tuple(reversed(face)))
    edge=list(range(n+1))+[j*(n+1)+n for j in range(1,n+1)]
    edge += [n*(n+1)+i for i in range(n-1,-1,-1)]
    edge += [j*(n+1) for j in range(n-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):faces.append((a,b,b+stride,a+stride))
    mesh=bpy.data.meshes.new('Puffed_Pillow_Mesh')
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(mat)
    obj=bpy.data.objects.new('Sofa_Puffed_Ochre_Pillow',mesh)
    bpy.context.collection.objects.link(obj)
    for face in mesh.polygons:face.use_smooth=True
    # Face along the sofa rather than outward: the broad back leans on the arm.
    transform=(Matrix.Translation(Vector(loc)) @ Matrix.Rotation(math.pi/2,4,'Z')
               @ Matrix.Rotation(-.40,4,'Y'))
    obj.matrix_world=transform
    points=[(0,verts[i][1],verts[i][2]) for i in edge]
    seam=stroke('Sofa_Pillow_Sewn_Edge',points+[points[0]],.003,mat)
    seam.matrix_world=transform
