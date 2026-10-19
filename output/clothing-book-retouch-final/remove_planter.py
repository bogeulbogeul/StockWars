"""Remove planter and match the left window bay to the original right window bay."""
import bpy,bmesh,pathlib,json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ClothingStore-planter-clean.blend'))
body=bpy.data.objects.get('ClothingStoreBody')
for o in list(bpy.context.scene.objects):
    if o.type=='MESH' and o!=body:bpy.data.objects.remove(o,do_unlink=True)
bm=bmesh.new();bm.from_mesh(body.data);uv=bm.loops.layers.uv.active
# Clip exact bay boundaries before replacing faces, avoiding centroid-cut triangle seams.
inverse=body.matrix_world.inverted()
for axis,value in [(0,.19),(0,.64),(0,-.75),(0,-.30),(1,-.505),(2,-.75),(2,-.441)]:
    point=Vector((0,0,0));point[axis]=value;normal=Vector((0,0,0));normal[axis]=1
    local_normal=body.matrix_world.to_3x3().transposed()@normal
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=0.0000001,plane_co=inverse@point,plane_no=local_normal,clear_inner=False,clear_outer=False)
right=[];left=[]
for face in bm.faces:
    x,y,z=body.matrix_world@face.calc_center_median()
    if y<-.505 and -.75<z<-.441:
        if .19<x<.64:right.append(face)
        if -.75<x<-.30:left.append(face)
records=[]
for f in right:
    records.append(([(loop.vert,loop[uv].uv.copy()) for loop in f.loops],f.material_index,f.smooth))
mapping={};inverse=body.matrix_world.inverted()
for loops,mat,smooth in records:
    vertices=[];texcoords=[]
    for old,coord in reversed(loops):
        if old not in mapping:
            point=body.matrix_world@old.co;point.x=-point.x-.11;mapping[old]=bm.verts.new(inverse@point)
        vertices.append(mapping[old]);texcoords.append(coord)
    face=bm.faces.new(vertices);face.material_index=mat;face.smooth=smooth
    for loop,coord in zip(face.loops,texcoords):loop[uv].uv=coord
bmesh.ops.delete(bm,geom=left,context='FACES');bm.normal_update();bm.to_mesh(body.data);bm.free();body.data.update()
for material in body.data.materials:
    if material.name.startswith('LeftWindowCleanGlass'):
        shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        for link in list(shader.inputs['Base Color'].links): material.node_tree.links.remove(link)
        shader.inputs['Base Color'].default_value=(.05,.08,.12,1)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-no-planter.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'ClothingStore-no-planter.blend'))
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'ClothingStore-no-planter.png');bpy.ops.render.render(write_still=True)
target=Vector((-.52,-.7,-.22));scene.camera.location=target+Vector((.12,-2,.4));scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=.85;scene.render.resolution_x=1200;scene.render.resolution_y=1200
scene.render.filepath=str(ROOT/'ClothingStore-no-planter-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'no-planter-info.json').write_text(json.dumps({'planter_objects_removed':True,'original_right_window_faces_mirrored':len(records),'left_window_faces_replaced':len(left),'uv_and_materials_copied_from_right':True},indent=2))
