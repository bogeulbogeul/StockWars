import bpy
from pathlib import Path
from mathutils import Matrix,Vector
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-single-sofa-v2';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-single-sofa-v1/Cipher-single-sofa.blend'))
def resized(p):return Vector((p.x*.88,p.y*.88,p.z if p.z<=.49 else .49+(p.z-.49)*.85))
for obj in bpy.context.scene.objects:
    if obj.type=='MESH':
        transform=obj.matrix_world.copy()
        for vertex in obj.data.vertices:vertex.co=resized(transform@vertex.co)
        obj.matrix_world=Matrix.Identity(4)
        obj.data.update()
    elif obj.type=='EMPTY':obj.location=resized(obj.location)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-single-sofa.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-single-sofa.glb'),export_format='GLB',export_extras=True)
