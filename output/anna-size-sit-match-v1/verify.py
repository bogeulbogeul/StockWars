import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'comparison.blend'));bpy.context.scene.frame_set(1);bpy.context.view_layer.update();r={};maximum=0
for name in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:
 a=bpy.data.objects[name];b=bpy.data.objects['Reference_'+name];ea=a.evaluated_get(bpy.context.evaluated_depsgraph_get());eb=b.evaluated_get(bpy.context.evaluated_depsgraph_get());ma=ea.to_mesh();mb=eb.to_mesh();err=max(((a.matrix_world@x.co)-(b.matrix_world@y.co)+Vector((1.56,0,0))).length for x,y in zip(ma.vertices,mb.vertices));maximum=max(maximum,err);ea.to_mesh_clear();eb.to_mesh_clear()
assert maximum<1e-5,maximum
r['equal_scale_seated_body_world_vertex_error']=maximum
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-size-sit-matched.glb'));r['clips']=[a.name for a in bpy.data.actions];assert len(r['clips'])==11
(P/'validation.json').write_text(json.dumps(r,indent=2));print(r)
