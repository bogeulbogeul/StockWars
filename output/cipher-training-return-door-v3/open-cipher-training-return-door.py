"""Reuse training shell; open only its right-side connection to the lobby."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-return-door-v3';out.mkdir(exist_ok=True)
sys.path.insert(0,str(root/'scratch'))
from exterior_geometry import box,extrude,arch_outline
bpy.ops.wm.open_mainfile(filepath=str(root/'output/cipher-training-lobby-shell-v2/Cipher-training-shell.blend'))
wall=bpy.data.materials['Cozy_Warm_Ivory'];blue=bpy.data.materials['Cozy_Muted_Blue']
body=next(o for o in bpy.context.scene.objects if o.name.startswith('Training_Closed_Side_Wall') and o.location.x>0)
body.name='Training_Right_Return_Wall'
cutter=extrude('Return_Door_Cutter',arch_outline(.66,1.14,bottom=-.05),-.35,.35,wall,0)
cutter.rotation_euler.z=math.pi/2;cutter.location=(4.58,1,0)
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Right_Arched_Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith('Training_Continuous_Side_Skirting') and obj.location.x>0:bpy.data.objects.remove(obj,do_unlink=True)
for start,end in [(-3.04,-1.79),(-.21,3.04)]:
    box('Training_Return_Skirting',(.10,end-start,.24),(4.45,-(start+end)/2,.12),blue,.025)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Cipher-training-shell.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'Cipher-training-shell.glb'),export_format='GLB')
deps=bpy.context.evaluated_depsgraph_get()
assert not bpy.context.scene.ray_cast(deps,Vector((0,1,.8)),Vector((1,0,0)))[0]
assert bpy.context.scene.ray_cast(deps,Vector((0,1,.8)),Vector((-1,0,0)))[0]
print('PASS: right return opening clear, left wall solid')
