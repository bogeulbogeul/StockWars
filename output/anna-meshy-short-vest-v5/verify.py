import bpy,json,struct,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent
names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf']
def snapshot(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));r={n:hashlib.sha256(b''.join(struct.pack('3f',*v.co) for v in bpy.data.objects[n].data.vertices)).hexdigest() for n in names};return r
old=snapshot(P.parent/'anna-sit-v1/Anna-sit.blend');new=snapshot(P/'Anna-meshy-short-vest.blend');assert old==new
r=json.loads((P/'validation.json').read_text(encoding='utf-8-sig'));r['base_and_leaf_vertices_unchanged']=True
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-meshy-short-vest.glb'));r['clips']=[a.name for a in bpy.data.actions];assert len(r['clips'])==8
(P/'validation.json').write_text(json.dumps(r,indent=2));print(r)
