import bpy, json
from pathlib import Path
root=Path('C:/GitHub/StockWars')
bpy.ops.wm.open_mainfile(filepath=str(root/'output/somangi-game-v1/somangi-walk.blend'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
print('SLEEP_RIG',json.dumps({
 'rig':rig.name,'bones':[dict(name=b.name,head=list(b.head_local),tail=list(b.tail_local),parent=b.parent.name if b.parent else None) for b in rig.data.bones],
 'meshes':[(o.name,len(o.data.vertices),o.hide_render) for o in bpy.data.objects if o.type=='MESH'],
 'materials':[(m.name,[(n.name,n.image.filepath if n.image else None) for n in m.node_tree.nodes if n.type=='TEX_IMAGE']) for m in bpy.data.materials if m.use_nodes],
},ensure_ascii=False))
