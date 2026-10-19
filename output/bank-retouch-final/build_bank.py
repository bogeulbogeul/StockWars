"""Native GLB material retouch; original mesh, UVs and base textures retained."""
import bpy, pathlib, json, numpy as np
from mathutils import Vector
ROOT=pathlib.Path('C:/GitHub/StockWars/output/bank-retouch-final')
OUT=pathlib.Path('C:/GitHub/StockWars/output/bank-retouch-final')
NAMES=['BankBuilding']
report=[]
for name in NAMES:
    if not (OUT/(name+'-basecolor.png')).exists(): continue
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/(name+'.blend')))
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    count=0
    for obj in objects:
        mesh=obj.data; mat=mesh.materials[0]
        bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        for socket,value in [('Metallic',0.0),('Roughness',0.82)]:
            for link in list(bsdf.inputs[socket].links): mat.node_tree.links.remove(link)
            bsdf.inputs[socket].default_value=value
        for node in mat.node_tree.nodes:
            if node.type=='NORMAL_MAP': node.inputs['Strength'].default_value=0.22
        tex=bsdf.inputs['Base Color'].links[0].from_node.image
        w,h=tex.size; pixels=np.empty(w*h*4,dtype=np.float32); tex.pixels.foreach_get(pixels); pixels=pixels.reshape(h,w,4)
        glass=bpy.data.materials.new('Slate blue soft glass'); glass.use_nodes=True
        g=glass.node_tree.nodes.get('Principled BSDF')
        # sRGB reference slate converted to linear light.
        g.inputs['Base Color'].default_value=(0.1046,0.1413,0.1779,1)
        g.inputs['Metallic'].default_value=0
        g.inputs['Roughness'].default_value=0.38
        g.inputs['Coat Weight'].default_value=0.18
        g.inputs['Coat Roughness'].default_value=0.3
        mesh.materials.append(glass); glass_index=len(mesh.materials)-1
        uv=mesh.uv_layers.active.data
        coords=np.empty(len(uv)*2,dtype=np.float32); uv.foreach_get('uv',coords)
        coords=coords.reshape(-1,3,2); middle=coords.mean(axis=1)
        samples=[]
        for t in [middle,*(coords[:,i,:]*.25+middle*.75 for i in range(3))]:
            samples.append(pixels[np.clip((t[:,1]*h).astype(int),0,h-1),np.clip((t[:,0]*w).astype(int),0,w-1),:3])
        colors=np.median(samples,axis=0); r,green,b=colors.T
        mask=(b>r*1.025)&(green>r*.99)&(b>0.015)
        for p in mesh.polygons:
            if not mask[p.index]: continue
            pos=obj.matrix_world@p.center
            if name=='FinanceBuilding' and (pos.z>=-0.10 or (abs(pos.x)<.29 and pos.y<-.55)): continue
            p.material_index=glass_index; count+=1
        bsdf.inputs['Base Color'].links[0].from_node.image=bpy.data.images.load(str(OUT/(name+'-basecolor.png')))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    path=OUT/(name+'-retouched.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_image_format='AUTO')
    scene=bpy.context.scene; scene.render.filepath=str(OUT/(name+'-after.png'))
    bpy.ops.render.render(write_still=True)
    camera=scene.camera; old=camera.location.copy()
    bounds=[obj.matrix_world@Vector(c) for c in obj.bound_box]; center=sum(bounds,Vector())/8
    offset=old-center; camera.location=center+Vector((-offset.x,-offset.y,offset.z)); camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+'-rear.png')); bpy.ops.render.render(write_still=True)
    report.append({'model':name,'glass_triangles':count,'output':str(path),'texture':'ImageGen retouch registered to original UVs; protected source boundaries and details'})
    (OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
