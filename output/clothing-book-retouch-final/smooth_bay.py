"""Fit reconstructed bay boundaries to the original facade and weld matching vertices."""
import bpy,bmesh,pathlib,json,math,numpy as np
from mathutils import Vector
from mathutils.geometry import barycentric_transform
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ClothingStore-no-planter.blend'))
body=bpy.data.objects.get('ClothingStoreBody')
existing=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/ClothingStore.glb')
source=next(o for o in bpy.context.scene.objects if o not in existing and o.type=='MESH')
points=[source.matrix_world@v.co for v in source.data.vertices]
tree=BVHTree.FromPolygons(points,[p.vertices[:] for p in source.data.polygons],all_triangles=True)
inverse=body.matrix_world.inverted();moved=0;maximum=0
for vertex in body.data.vertices:
    point=body.matrix_world@vertex.co;x,y,z=point
    if not(-.79<x<-.26 and -.64<y<-.495 and -.76<z<-.405):continue
    edge=min(abs(x+.75),abs(x+.30),abs(z+.441))
    if edge>.035:continue
    nearest,normal,index,distance=tree.find_nearest(point)
    if nearest is None or distance>.045:continue
    weight=(1-edge/.035)**2
    delta=(nearest-point)*weight
    # Preserve exact cut coordinates while matching the facade's depth and profile.
    if abs(x+.75)<1e-5 or abs(x+.30)<1e-5:delta.x=0
    if abs(z+.441)<1e-5:delta.z=0
    if delta.length>1e-7:
        maximum=max(maximum,delta.length);vertex.co=inverse@(point+delta);moved+=1
bm=bmesh.new();bm.from_mesh(body.data)
near=[]
for v in bm.verts:
    x,y,z=body.matrix_world@v.co
    if -.79<x<-.26 and -.65<y<-.49 and -.76<z<-.40:near.append(v)
before=len(bm.verts);bmesh.ops.remove_doubles(bm,verts=near,dist=.00065)
welded=before-len(bm.verts);bm.normal_update();bm.to_mesh(body.data);bm.free();body.data.update()
# Blend original facade pigment across the fitted boundary, then bake portable GLB textures.
source_shader=next(n for n in source.data.materials[0].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
source_image=source_shader.inputs['Base Color'].links[0].from_node.image
w,h=source_image.size;pixels=np.array(source_image.pixels[:]).reshape(h,w,4);source_uv=source.data.uv_layers.active.data
colors=np.zeros((len(body.data.loops),4),dtype=np.float32)
for face in body.data.polygons:
    p=body.matrix_world@face.center
    if not(-.80<p.x<-.25 and -.65<p.y<-.495 and -.77<p.z<-.39):continue
    for li in face.loop_indices:
        point=body.matrix_world@body.data.vertices[body.data.loops[li].vertex_index].co
        edge=min(abs(point.x+.75),abs(point.x+.30),abs(point.z+.441))
        if edge>.045:continue
        nearest,normal,index,distance=tree.find_nearest(point)
        if index is None or distance>.06:continue
        triangle=source.data.polygons[index]
        verts=[points[i] for i in triangle.vertices]
        uv=[Vector((*source_uv[i].uv,0)) for i in triangle.loop_indices]
        coordinate=barycentric_transform(nearest,*verts,*uv)
        rgb=pixels[min(h-1,max(0,int(coordinate.y*h))),min(w-1,max(0,int(coordinate.x*w))),:3]
        # Exclude plant pigment and other unrelated nearest surfaces.
        if not(rgb[0]>rgb[1] and rgb[1]>rgb[2] and rgb.min()>.15):continue
        linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
        colors[li,:3]=linear;colors[li,3]=(1-edge/.045)**2
attribute=body.data.color_attributes.new(name='FacadeSeamBlend',type='FLOAT_COLOR',domain='CORNER');attribute.data.foreach_set('color',colors.ravel())
baked=bpy.data.images.new('Seamless facade base color',width=2048,height=2048,alpha=False)
restore=[]
for mat in body.data.materials:
    ns=mat.node_tree.nodes;ls=mat.node_tree.links;p=next(n for n in ns if n.type=='BSDF_PRINCIPLED');out=next(n for n in ns if n.type=='OUTPUT_MATERIAL')
    attr=ns.new('ShaderNodeVertexColor');attr.layer_name=attribute.name
    mix=ns.new('ShaderNodeMixRGB');ls.new(attr.outputs['Alpha'],mix.inputs[0]);ls.new(attr.outputs['Color'],mix.inputs[2])
    if p.inputs['Base Color'].links:ls.new(p.inputs['Base Color'].links[0].from_socket,mix.inputs[1])
    else:mix.inputs[1].default_value=p.inputs['Base Color'].default_value
    emission=ns.new('ShaderNodeEmission');ls.new(mix.outputs[0],emission.inputs[0]);ls.new(emission.outputs[0],out.inputs[0])
    target=ns.new('ShaderNodeTexImage');target.image=baked
    for n in ns:n.select=False
    target.select=True;ns.active=target;restore.append((mat,p,out,emission,target,attr,mix))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=1;scene.render.bake.margin=8;bpy.ops.object.bake(type='EMIT')
baked.filepath_raw=str(ROOT/'ClothingStore-smooth-basecolor.png');baked.file_format='PNG';baked.save()
for mat,p,out,emission,target,attr,mix in restore:
    ls=mat.node_tree.links;ls.new(p.outputs[0],out.inputs[0]);ls.new(target.outputs['Color'],p.inputs['Base Color'])
    for n in [emission,attr,mix]:mat.node_tree.nodes.remove(n)
body.data.color_attributes.remove(attribute);scene.render.engine='BLENDER_EEVEE'
for o in list(bpy.context.scene.objects):
    if o not in existing:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-smooth.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'ClothingStore-smooth.blend'))
s=bpy.context.scene;s.render.filepath=str(ROOT/'ClothingStore-smooth.png');bpy.ops.render.render(write_still=True)
target=Vector((-.52,-.7,-.22));s.camera.location=target+Vector((.12,-2,.4));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=.85;s.render.resolution_x=1200;s.render.resolution_y=1200
s.render.filepath=str(ROOT/'ClothingStore-smooth-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'smooth-info.json').write_text(json.dumps({'boundary_vertices_fitted':moved,'duplicate_vertices_welded':welded,'maximum_adjustment':maximum,'planter_removed':True},indent=2))
