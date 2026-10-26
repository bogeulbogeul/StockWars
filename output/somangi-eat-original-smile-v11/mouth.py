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
    patch_ids=sorted({v for f in mouth_faces for v in f.vertices})
    mapping={v:i for i,v in enumerate(patch_ids)}
    patch_faces=[[mapping[v] for v in f.vertices] for f in mouth_faces]
    material=bpy.data.materials.new('Animated mouth black');material.use_nodes=True
    bs=material.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.001,.0005,.0005,1)
    bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
    rows=9
    faces=[(rows*i+r,rows*i+r+1,rows*(i+1)+r+1,rows*(i+1)+r)
           for i in range(32) for r in range(rows-1)]
    arrays=[];patch_arrays=[];polygons=[list(f.vertices) for f in body.data.polygons]
    for i,coords in enumerate(cache):
        t=i/30;opening=max(math.exp(-((t-a)/.085)**2) for a in [1.09,1.49,1.79])
        chew=max(.22*math.exp(-((t-a)/.06)**2) for a in [1.25,1.65,1.96]);opening=max(opening,chew)
        active=opening>.025
        current=coords[list(mouth_vertices)].mean(0)
        tree=BVHTree.FromPolygons([Vector(p) for p in coords],polygons,all_triangles=False)
        hidden=np.tile((current[0],-.20,current[2]),(len(patch_ids),1))
        patch_arrays.append(np.array([Vector(coords[v])+tree.find_nearest(Vector(coords[v]))[1]*.002
                                      for v in patch_ids]) if active else hidden)
        points=[]
        for k in range(33):
            u=-1+2*k/32;arc=max(0,1-u*u)**.5;width=.032+.035*opening
            upper=(.008+.072*opening)*arc
            lower=-upper
            for dz in np.linspace(upper,lower,rows):
                pos=Vector((current[0]+width*u,-1,current[2]+dz))
                hit,normal,_,_=tree.ray_cast(pos,Vector((0,1,0)),2)
                points.append(tuple(hit+normal*.006) if hit else (pos.x,-.48,pos.z))
        arrays.append(np.array(points) if active else np.tile((current[0],-.20,current[2]),(len(points),1)))
    mesh=bpy.data.meshes.new('Mouth expression surface');mesh.from_pydata(arrays[0],[],faces);mesh.update()
    obj=bpy.data.objects.new('Somangi_AnimatedMouth',mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(material)
    for f in mesh.polygons:f.use_smooth=True
    patch_mesh=bpy.data.meshes.new('Temporary smile cover');patch_mesh.from_pydata(patch_arrays[0],[],patch_faces);patch_mesh.update()
    patch=bpy.data.objects.new('Somangi_TemporarySmileCover',patch_mesh);bpy.context.collection.objects.link(patch)
    patch_mesh.materials.append(skin)
    for f in patch_mesh.polygons:f.use_smooth=True
    return obj,arrays,patch,patch_arrays
