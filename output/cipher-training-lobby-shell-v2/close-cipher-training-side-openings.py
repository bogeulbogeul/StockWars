"""Reuse the accepted lobby shell, closing only unused training side openings."""
import bpy,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from exterior_geometry import box
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-lobby-shell-v2';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-cozy-room-compact-v2/Cipher-cozy-room.blend'))
wall=bpy.data.materials['Cozy_Warm_Ivory'];blue=bpy.data.materials['Cozy_Muted_Blue']
for obj in list(bpy.data.objects):
    if obj.name.startswith(('Room_Side_Wall','Side_Blue_Skirting')):
        bpy.data.objects.remove(obj,do_unlink=True)
for side in [-1,1]:
    box('Training_Closed_Side_Wall',(.16,6.08,3),(side*4.58,0,1.5),wall,.025)
    box('Training_Continuous_Side_Skirting',(.10,6.08,.24),(side*4.45,0,.12),blue,.025)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-shell.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-shell.glb'),export_format='GLB')
# Validate the previously open doorway at seated and standing heights.
from mathutils import Vector
deps=bpy.context.evaluated_depsgraph_get()
for side in [-1,1]:
    for height in [.8,1.5]:
        hit=bpy.context.scene.ray_cast(deps,Vector((0,1,height)),Vector((side,0,0)))
        assert hit[0] and abs(abs(hit[1].x)-4.5)<.05
print('PASS: reused lobby shell; both side openings are solid walls')
