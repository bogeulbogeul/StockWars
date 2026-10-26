import bpy,numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
from motion_utils import bake_shapes

def clean_cover(body,patch):
    # Keep the original face UVs and shading on the temporary smile cover.
    mesh=body.data;base=np.array([tuple(v.co) for v in mesh.vertices]);faces=[]
    for face in mesh.polygons:
        c=base[list(face.vertices)].mean(0)
        if abs(c[0])<.105 and .15<c[2]<.33 and c[1]<-.35:faces.append(face)
    assert len(faces)==len(patch.data.polygons)
    uv=patch.data.uv_layers.new(name='UVMap')
    for a,b in zip(patch.data.polygons,faces):
        for i,j in zip(a.loop_indices,b.loop_indices):uv.data[i].uv=mesh.uv_layers.active.data[j].uv
    material=mesh.materials[0].copy();material.name='Original face UV clean smile cover'
    shader=material.node_tree.nodes.get('Principled BSDF');texture=shader.inputs['Base Color'].links[0].from_node
    image=texture.image.copy();image.name='Original face with smile cleared for eating only'
    w,h=image.size;pixels=np.array(image.pixels[:],dtype=np.float32).reshape(h,w,4);region=np.zeros((h,w),bool)
    for face in faces:
        loops=list(face.loop_indices)
        for j in range(1,len(loops)-1):
            triangle=np.array([mesh.uv_layers.active.data[k].uv[:] for k in [loops[0],loops[j],loops[j+1]]])*[w,h]-.5
            lo=np.maximum(0,np.floor(triangle.min(0)).astype(int));hi=np.minimum([w-1,h-1],np.ceil(triangle.max(0)).astype(int))
            mat=np.stack([triangle[1]-triangle[0],triangle[2]-triangle[0]],axis=1)
            if abs(np.linalg.det(mat))<1e-8:continue
            xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1))
            q=np.stack([xx-triangle[0,0],yy-triangle[0,1]],axis=-1)@np.linalg.inv(mat).T
            inside=(q[:,:,0]>=-.01)&(q[:,:,1]>=-.01)&(q.sum(2)<=1.01)
            region[lo[1]:hi[1]+1,lo[0]:hi[0]+1]|=inside
    dark=region&(pixels[:,:,:3].max(2)<.85)
    rows,columns=np.where(dark);loy=max(0,rows.min()-10);hiy=min(h,rows.max()+11)
    lox=max(0,columns.min()-10);hix=min(w,columns.max()+11)
    crop=pixels[loy:hiy,lox:hix];known=~dark[loy:hiy,lox:hix]
    for _ in range(64):
        if known.all():break
        total=np.zeros_like(crop[:,:,:3]);count=np.zeros_like(known,dtype=float)
        for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
            mask=np.roll(known,(dy,dx),(0,1));total+=np.roll(crop[:,:,:3],(dy,dx),(0,1))*mask[:,:,None];count+=mask
        fill=(~known)&(count>0);crop[:,:,:3][fill]=total[fill]/count[fill,None];known[fill]=True
    assert known.all();image.pixels.foreach_set(pixels.ravel());image.file_format='PNG';image.pack();texture.image=image
    patch.data.materials.clear();patch.data.materials.append(material)
    ink=mesh.materials[1].copy();ink.name='Original matte face ink cleared for eating only'
    ink.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].links[0].from_node.image=image
    patch.data.materials.append(ink)
    for target,source in zip(patch.data.polygons,faces):target.material_index=source.material_index
    arrays=[]
    for key in list(patch.data.shape_keys.key_blocks)[1:]:
        a=np.empty(len(key.data)*3,dtype=np.float32);key.data.foreach_get('co',a);arrays.append(a.reshape(-1,3))
    bpy.context.scene.frame_set(34);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    tree=KDTree(len(m.vertices))
    for v in m.vertices:tree.insert(v.co,v.index)
    tree.balance();normals=[m.vertices[tree.find(Vector(p))[1]].normal.copy() for p in arrays[33]];ev.to_mesh_clear()
    for a in arrays:
        if np.ptp(a[:,0])>.02:a-=np.array(normals)*.0015
    patch.shape_key_clear();patch.data.vertices.foreach_set('co',arrays[33].ravel());patch.data.update()
    bake_shapes(patch,arrays,'OriginalSmileCover')
    patch.data.normals_split_custom_set([normals[loop.vertex_index] for loop in patch.data.loops])
