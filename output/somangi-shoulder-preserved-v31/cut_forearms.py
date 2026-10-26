import bpy,numpy as np
from mathutils import Vector

def cut(body,parts):
    old=body.data;points=[v.co.copy() for v in old.vertices];uv=old.uv_layers.active.data;normals=[n.vector.copy() for n in old.corner_normals]
    positions=[];faces=[];tex=[];norm=[];materials=[];groups={0:[],1:[],2:[]};lookup={}
    centers={1:Vector((.42,0,-.29)),2:Vector((-.42,0,-.29))}
    axes={1:Vector((.56,0,-.83)).normalized(),2:Vector((-.56,0,-.83)).normalized()}
    membership={i:side for side,ids in parts.items() for i in ids}
    def clip(poly,side,positive):
        result=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            fa=(a[0]-centers[side]).dot(axes[side]);fb=(b[0]-centers[side]).dot(axes[side])
            ina=fa>=-1e-8 if positive else fa<=1e-8;inb=fb>=-1e-8 if positive else fb<=1e-8
            if ina:result.append(a)
            if ina!=inb:
                t=fa/(fa-fb);result.append((a[0].lerp(b[0],t),a[1].lerp(b[1],t),a[2].lerp(b[2],t).normalized()))
        return result
    def append(poly,part,material):
        for j in range(1,len(poly)-1):
            tri=[poly[0],poly[j],poly[j+1]];indices=[]
            for p,t,n in tri:
                key=(part,*(round(v,7) for v in p))
                if key not in lookup:lookup[key]=len(positions);groups[part].append(len(positions));positions.append(p[:])
                indices.append(lookup[key]);tex.append(t[:]);norm.append(n[:])
            if len(set(indices))<3:del tex[-3:];del norm[-3:];continue
            faces.append(indices);materials.append(material)
    for face in old.polygons:
        payload=[(points[i],uv[j].uv.copy(),normals[j]) for i,j in zip(face.vertices,face.loop_indices)]
        side=membership.get(face.vertices[0],0)
        if side and all(membership.get(i)==side for i in face.vertices):
            append(clip(payload,side,False),0,face.material_index);append(clip(payload,side,True),side,face.material_index)
        else:append(payload,0,face.material_index)
    mesh=bpy.data.meshes.new('Original surface with elbow articulation');mesh.from_pydata(positions,[],faces);mesh.update()
    for material in old.materials:mesh.materials.append(material)
    layer=mesh.uv_layers.new(name='UVMap')
    for i,value in enumerate(tex):layer.data[i].uv=value
    for face,material in zip(mesh.polygons,materials):face.material_index=material;face.use_smooth=True
    mesh.normals_split_custom_set(norm);body.data=mesh;body.vertex_groups.clear()
    for part,name in [(0,'Body'),(1,'Fore.L'),(2,'Fore.R')]:body.vertex_groups.new(name=name).add(groups[part],1,'REPLACE')
    return centers,groups
