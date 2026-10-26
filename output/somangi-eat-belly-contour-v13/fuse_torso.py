import bpy,bmesh,numpy as np

def fuse(base,root,old_faces,patch_vertices,patch_faces):
    ids=sorted(root);mapping={v:i for i,v in enumerate(ids)}
    coords=base[ids].copy();x=coords[:,0];y=coords[:,1];z=coords[:,2]
    fold=np.exp(-((np.abs(x)-.28)/.13)**4-(y/.13)**4-((z+.28)/.17)**4)
    coords[:,0]-=np.sign(x)*.12*fold
    coords[:,2]+=.035*np.clip((z+.06)/.07,0,1)**2
    data=bpy.data.meshes.new('Closed original torso');data.from_pydata(coords,[],[[mapping[v] for v in f.vertices] for f in old_faces]);data.update()
    bm=bmesh.new();bm.from_mesh(data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new('Torso union original',data);bpy.context.collection.objects.link(obj)
    patch_data=bpy.data.meshes.new('Side support solid');patch_data.from_pydata(patch_vertices,[],patch_faces);patch_data.update()
    patch=bpy.data.objects.new('Side support solid',patch_data);bpy.context.collection.objects.link(patch)
    bpy.ops.object.select_all(action='DESELECT');patch.select_set(True);bpy.context.view_layer.objects.active=patch
    solid=patch.modifiers.new('Internal support volume','SOLIDIFY');solid.thickness=.18;solid.offset=-1
    bpy.ops.object.modifier_apply(modifier=solid.name)
    obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.join()
    obj.data.remesh_voxel_size=.004;bpy.ops.object.voxel_remesh()
    group=obj.vertex_groups.new(name='Torso fairing only')
    def ease(t):
        t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
    for v in obj.data.vertices:
        weight=ease((v.co.z+.76)/.16)*ease((-.02-v.co.z)/.10)
        if weight:group.add([v.index],weight,'REPLACE')
    smooth=obj.modifiers.new('Continuous torso surface','SMOOTH')
    smooth.iterations=700;smooth.factor=1;smooth.vertex_group=group.name
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    result=np.array([tuple(v.co+v.normal*.001) for v in obj.data.vertices])
    reference=base[ids]
    for axis in [0,1]:
        low,high=reference[:,axis].min(),reference[:,axis].max()
        body=result[:,2]>-.60;lo,hi=result[body,axis].min(),result[body,axis].max()
        target=low+(result[:,axis]-lo)*(high-low)/(hi-lo)
        weight=np.array([ease((z+.76)/.16) for z in result[:,2]])
        result[:,axis]+=(target-result[:,axis])*weight
    faces=[list(f.vertices) for f in obj.data.polygons]
    bpy.data.objects.remove(obj,do_unlink=True)
    return result,faces
