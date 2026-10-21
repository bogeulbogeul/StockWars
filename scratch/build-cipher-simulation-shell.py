"""Mirror the accepted training shell so the lobby connection is on the left."""
import bpy,bmesh
from pathlib import Path
from mathutils import Matrix
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-simulation-shell-v1';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-training-return-door-v3/Cipher-training-shell.blend'))
mirror=Matrix.Diagonal((-1,1,1,1))
for obj in list(bpy.context.scene.objects):
    obj.matrix_world=mirror@obj.matrix_world
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if obj.type=='MESH':
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    obj.select_set(False)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-simulation-shell.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-simulation-shell.glb'),export_format='GLB')
