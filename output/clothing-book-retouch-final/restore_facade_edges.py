"""Restore original masonry around the reconstructed wooden panel to remove patch edges."""
import bpy,bmesh,pathlib,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ClothingStore-smooth.blend'))
body=bpy.data.objects.get('ClothingStoreBody');existing=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/ClothingStore.glb')
source=next(o for o in bpy.context.scene.objects if o not in existing and o.type=='MESH')
target=bmesh.new();target.from_mesh(body.data);original=bmesh.new();original.from_mesh(source.data)
planes=[(0,v) for v in [-.79,-.70,-.35,-.26]]+[(1,v) for v in [-.61,-.505]]+[(2,v) for v in [-.75,-.64,-.405]]
for bm,obj in [(target,body),(original,source)]:
    inverse=obj.matrix_world.inverted()
    for axis,value in planes:
        point=Vector((0,0,0));point[axis]=value;normal=Vector((0,0,0));normal[axis]=1
        bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=inverse@point,plane_no=obj.matrix_world.to_3x3().transposed()@normal,clear_inner=False,clear_outer=False)
def region(point):
    x,y,z=point
    return -.79<x<-.26 and -.61<y<-.505 and -.75<z<-.405 and (x<-.70 or x>-.35 or z<-.64)
remove=[f for f in target.faces if region(body.matrix_world@f.calc_center_median())]
bmesh.ops.delete(target,geom=remove,context='FACES')
mat=source.data.materials[0].copy();mat.name='OriginalFacadeContinuousStone'
shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
for name,value in [('Metallic',0),('Roughness',.82)]:
    for link in list(shader.inputs[name].links):mat.node_tree.links.remove(link)
    shader.inputs[name].default_value=value
for n in mat.node_tree.nodes:
    if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.22
body.data.materials.append(mat);material_index=len(body.data.materials)-1
source_uv=original.loops.layers.uv.active;target_uv=target.loops.layers.uv.active
mapping={};inverse=body.matrix_world.inverted();copied=0
for face in original.faces:
    if not region(source.matrix_world@face.calc_center_median()):continue
    vertices=[]
    for vertex in face.verts:
        if vertex not in mapping:mapping[vertex]=target.verts.new(inverse@(source.matrix_world@vertex.co))
        vertices.append(mapping[vertex])
    new=target.faces.new(vertices);new.material_index=material_index;new.smooth=face.smooth
    for a,b in zip(new.loops,face.loops):a[target_uv].uv=b[source_uv].uv
    copied+=1
target.normal_update();target.to_mesh(body.data);target.free();original.free();body.data.update()
for o in list(bpy.context.scene.objects):
    if o not in existing:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-smooth.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.camera.data.ortho_scale=1.900*1.45;scene.render.resolution_x=900;scene.render.resolution_y=800
# Restore the established full-building camera.
points=[body.matrix_world@Vector(c) for c in body.bound_box];center=sum(points,Vector())/8;span=max(max(p[i] for p in points)-min(p[i] for p in points) for i in range(3))
scene.camera.location=center+Vector((span*1.2,-span*2,span*.9));scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'ClothingStore-smooth.blend'))
scene.render.filepath=str(ROOT/'ClothingStore-smooth.png');bpy.ops.render.render(write_still=True)
point=Vector((-.52,-.7,-.22));scene.camera.location=point+Vector((.12,-2,.4));scene.camera.rotation_euler=(point-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=.85;scene.render.resolution_x=1200;scene.render.resolution_y=1200
scene.render.filepath=str(ROOT/'ClothingStore-smooth-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'facade-restoration.json').write_text(json.dumps({'original_masonry_faces_restored':copied,'patch_faces_replaced':len(remove)},indent=2))
