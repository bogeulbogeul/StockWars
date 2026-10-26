import bpy,numpy as np,hashlib,json
from pathlib import Path
P=Path(__file__).resolve().parent
def snapshot(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));body=bpy.data.objects['Somangi_SmoothBody']
    digest=hashlib.sha256()
    for key in body.data.shape_keys.key_blocks:
        a=np.empty(len(key.data)*3,dtype=np.float32);key.data.foreach_get('co',a);digest.update(a.tobytes())
    uv=np.array([tuple(v.uv) for v in body.data.uv_layers.active.data],dtype=np.float32)
    digest.update(uv.tobytes())
    prop=[];root=bpy.data.objects['bread_Prop']
    for frame in range(1,92):
        bpy.context.scene.frame_set(frame);prop.append(list(root.matrix_world))
    ink=body.data.materials[1].node_tree.nodes.get('Principled BSDF')
    return digest.hexdigest(),np.array(prop),[ink.inputs[k].default_value for k in ['Metallic','Roughness','Specular IOR Level']]
old=snapshot(P.parent/'somangi-eat-reference-v9/somangi-eat.blend')
new=snapshot(P/'somangi-eat.blend')
assert old[0]==new[0]
assert np.max(np.abs(old[1]-new[1]))==0
assert old[2]==new[2]
report=json.loads((P/'validation.json').read_text())
report.update({'bodyMorphAndUvIdenticalToV9':True,'breadTransformDifferenceFromV9':0,
 'eyeMaterialIdenticalToV9':True,'mouthReference':'somangi-chew-v1: max half-width .067, half-height .080'})
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
