import bpy,math,numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
def replace_mouth(body,base,cache):
    mouth_faces=[];mouth_vertices=set()
    for f in body.data.polygons:
        c=base[list(f.vertices)].mean(0)
        if abs(c[0])<.105 and .15<c[2]<.33 and c[1]<-.35:
            mouth_faces.append(f)
            if f.material_index==1:mouth_vertices.update(f.vertices)
    center=base[list(mouth_vertices)].mean(0)
    clean=next(f for f in body.data.polygons if .11<f.center.x<.15 and .22<f.center.z<.28 and f.center.y<-.35)
    uv=body.data.uv_layers.active.data
    texcoord=sum((uv[i].uv for i in clean.loop_indices),Vector((0,0)))/len(clean.loop_indices)
    skin=body.data.materials[0].copy();skin.name='Mouth area original skin'
    shader=next(n for n in skin.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    texture=shader.inputs['Base Color'].links[0].from_node
    image=texture.image;w,h=image.size;pixel=(min(h-1,int(texcoord.y*h))*w+min(w-1,int(texcoord.x*w)))*4
    color=list(image.pixels[pixel:pixel+3])
    linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color]
    for link in list(shader.inputs['Base Color'].links):skin.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value=(*linear,1)
    body.data.materials.append(skin)
    for f in mouth_faces:f.material_index=len(body.data.materials)-1
    material=bpy.data.materials.new('Animated mouth black');material.use_nodes=True
    bs=material.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.001,.0005,.0005,1)
    bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
    faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(32)]
    arrays=[];polygons=[list(f.vertices) for f in body.data.polygons]
    for i,coords in enumerate(cache):
        t=i/30;opening=max(math.exp(-((t-a)/.085)**2) for a in [1.09,1.49,1.79])
        chew=max(.22*math.exp(-((t-a)/.06)**2) for a in [1.25,1.65,1.96]);opening=max(opening,chew)
        current=coords[list(mouth_vertices)].mean(0)
        tree=BVHTree.FromPolygons([Vector(p) for p in coords],polygons,all_triangles=False)
        points=[]
        for k in range(33):
            u=-1+2*k/32;arc=max(0,1-u*u)**.5;width=.065*(1-opening)+.058*opening
            closed=-.024*(1-u*u)
            upper=closed*(1-opening)+.035*arc*opening
            lower=(closed-.014*arc)*(1-opening)-.045*arc*opening
            for dz in [upper,lower]:
                pos=Vector((current[0]+width*u,-1,current[2]+dz))
                hit,normal,_,_=tree.ray_cast(pos,Vector((0,1,0)),2)
                points.append(tuple(hit+normal*.006) if hit else (pos.x,-.48,pos.z))
        arrays.append(np.array(points))
    mesh=bpy.data.meshes.new('Mouth expression surface');mesh.from_pydata(arrays[0],[],faces);mesh.update()
    obj=bpy.data.objects.new('Somangi_AnimatedMouth',mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(material)
    for f in mesh.polygons:f.use_smooth=True
    return obj,arrays
