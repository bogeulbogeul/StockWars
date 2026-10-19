"""Rebuild clean material color fields on the existing mesh and bake to its UVs."""
import bpy, pathlib, numpy as np, json
from mathutils import Vector
SRC=pathlib.Path('C:/GitHub/StockWars/output/building-retouch-v1')
OUT=pathlib.Path('C:/GitHub/StockWars/output/building-retouch-v2')
NAMES=['FinanceBuilding','FunitueStoreBuilding','StoreBuilding','InformationBuilding','HomeBuilding']
def linear(rgb):
    a=np.array(rgb,dtype=float)/255
    return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
report=[]
for name in NAMES:
    bpy.ops.wm.open_mainfile(filepath=str(SRC/(name+'.blend')))
    obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
    mesh=obj.data; material=mesh.materials[0]; nodes=material.node_tree.nodes; links=material.node_tree.links
    bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    texture=bsdf.inputs['Base Color'].links[0].from_node
    w,h=texture.image.size
    rgba=np.empty(w*h*4,dtype=np.float32); texture.image.pixels.foreach_get(rgba); rgba=rgba.reshape(h,w,4)
    uv=np.empty(len(mesh.loops)*2,dtype=np.float32); mesh.uv_layers.active.data.foreach_get('uv',uv)
    uv=uv.reshape(-1,3,2); middle=uv.mean(axis=1)
    samples=[]
    for t in [middle,*(uv[:,i,:]*.3+middle*.7 for i in range(3))]:
        samples.append(rgba[np.clip((t[:,1]*h).astype(int),0,h-1),np.clip((t[:,0]*w).astype(int),0,w-1),:3])
    rgb=np.median(samples,axis=0); r,g,b=rgb.T
    maximum=rgb.max(axis=1); minimum=rgb.min(axis=1)
    count=len(mesh.polygons)
    centers=np.empty(count*3,dtype=np.float32); mesh.polygons.foreach_get('center',centers)
    centers=centers.reshape(-1,3)
    matrix=np.array(obj.matrix_world); world=centers@matrix[:3,:3].T+matrix[:3,3]
    x,y,z=world.T
    # Color families are assigned on the native mesh, never by moving UV islands.
    palette=[(235,214,176),(170,119,61),(174,161,139),(76,65,54),(67,91,60),(225,83,54),(242,105,101),(48,76,119),(87,104,119),(216,169,65),(246,230,195),(43,42,36)]
    labels=np.zeros(count,dtype=np.int32)
    gray=(maximum-minimum)<.105
    labels[gray & (maximum<.77)]=2
    saturation=(maximum-minimum)/np.maximum(maximum,.001)
    wood=(r>g*1.18)&(g>b*1.2)&(saturation>.48)&(maximum<.84)
    labels[wood]=1
    labels[(maximum<.32)&(r>b*1.1)]=3
    labels[(g>r*1.07)&(g>b*1.05)]=4
    labels[(r>g*1.55)&(r>b*1.4)]=5 if name=='HomeBuilding' else 6
    blue=(b>r*1.025)&(g>r*.99)&(b>.015)
    labels[blue]=8
    if name=='FinanceBuilding':
        labels[blue & ((z>=-.10)|((abs(x)<.29)&(y<-.55)))]=7
    if name=='FunitueStoreBuilding':
        labels[(maximum<.43)&(~blue)]=3
    labels[(maximum>.86)&((maximum-minimum)<.30)]=0
    labels[(maximum<.14)&(~blue)]=11
    labels[(r>g*1.05)&(g>b*1.5)&(g>.5)&(r>.7)&(saturation>.62)]=9
    bottom=z.min()+(z.max()-z.min())*.17
    labels[(z<bottom)&(~blue)&(~wood)]=2
    # Preserve texture-only symbols, clock markings, hardware and tiny dark details.
    keep=np.zeros(count,dtype=bool)
    if name=='FinanceBuilding':
        keep|=(abs(x)<.26)&(z>.26)
        keep|=(abs(x)<.23)&(y<-.65)&(z>-.30)&(z<.02)
    if name in ['StoreBuilding','InformationBuilding']:
        keep|=(abs(x)<.27)&(y<-.38)&(z>-.03)&(z<.36)
    keep|=(labels==9)|(labels==11)
    # Continuous material fields remove mismatched smears and baked lighting patches.
    colors=np.array([linear(c) for c in palette],dtype=np.float32)[labels]
    corner=np.ones((count*3,4),dtype=np.float32); corner[:,:3]=np.repeat(colors,3,axis=0)
    corner[:,3]=np.repeat(keep.astype(np.float32),3)
    attr=mesh.color_attributes.new(name='RetouchedColor',type='FLOAT_COLOR',domain='CORNER')
    attr.data.foreach_set('color',corner.ravel())
    vertex=nodes.new('ShaderNodeVertexColor'); vertex.layer_name=attr.name
    mix=nodes.new('ShaderNodeMixRGB'); links.new(vertex.outputs['Color'],mix.inputs[1]); links.new(texture.outputs['Color'],mix.inputs[2]); links.new(vertex.outputs['Alpha'],mix.inputs[0])
    emit=nodes.new('ShaderNodeEmission'); links.new(mix.outputs[0],emit.inputs[0])
    output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL'); links.new(emit.outputs[0],output.inputs['Surface'])
    baked=bpy.data.images.new(name+' clean base color',width=w,height=h,alpha=False)
    target=nodes.new('ShaderNodeTexImage'); target.image=baked
    for n in nodes: n.select=False
    target.select=True; nodes.active=target
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=1
    scene.render.bake.margin=12; scene.render.bake.use_clear=True
    bpy.ops.object.bake(type='EMIT')
    baked.filepath_raw=str(OUT/(name+'-clean-basecolor.png')); baked.file_format='PNG'; baked.save()
    links.new(bsdf.outputs[0],output.inputs['Surface']); links.new(target.outputs['Color'],bsdf.inputs['Base Color'])
    for socket,value in [('Metallic',0),('Roughness',.82)]:
        for link in list(bsdf.inputs[socket].links): links.remove(link)
        bsdf.inputs[socket].default_value=value
    for node in nodes:
        if node.type=='NORMAL_MAP': node.inputs['Strength'].default_value=.18
    glass=bpy.data.materials.new('Soft slate glass'); glass.use_nodes=True
    shader=glass.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*linear((91,105,118)),1)
    shader.inputs['Roughness'].default_value=.38; shader.inputs['Coat Weight'].default_value=.18
    mesh.materials.append(glass)
    material_indices=(labels==8).astype(np.int32); mesh.polygons.foreach_set('material_index',material_indices)
    # The exported image is the baked result; remove unused staging nodes/attribute.
    for node in [vertex,mix,emit]: nodes.remove(node)
    mesh.color_attributes.remove(attr)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'-retouched.glb')),export_format='GLB',use_selection=True,export_image_format='AUTO',export_vertex_color='NONE')
    scene.render.engine='BLENDER_EEVEE'; scene.render.filepath=str(OUT/(name+'-after.png')); bpy.ops.render.render(write_still=True)
    camera=scene.camera; old=camera.location.copy()
    bounds=[obj.matrix_world@Vector(c) for c in obj.bound_box]; center=sum(bounds,Vector())/8
    offset=old-center; camera.location=center+Vector((-offset.x,-offset.y,offset.z)); camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+'-rear.png')); bpy.ops.render.render(write_still=True)
    report.append({'model':name,'glass_triangles':int(material_indices.sum()),'texture_size':[w,h],'method':'native mesh material color reconstruction and UV emission bake'})
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
