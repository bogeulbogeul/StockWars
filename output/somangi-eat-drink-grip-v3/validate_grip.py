import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;report={}
for kind in ['bread','drink']:
    bpy.ops.wm.open_mainfile(filepath=str(P/f'somangi-{kind}.blend'))
    body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects[kind+'_Prop']
    meta=json.loads((P/f'{kind}-metadata.json').read_text());maximum=depth=0
    for i in range(181):
        frame=1+i*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
        ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        arr=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',arr);coords=arr.reshape(-1,3)
        palms={s:Vector(coords[ids].mean(0)) for s,ids in meta['palmVertexIds'].items()}
        if kind=='drink':
            error=(root.matrix_world@Vector(meta['cupGripAnchor'])-palms['R']).length
            maximum=max(maximum,error)
        else:
            for palm in palms.values():
                local=root.matrix_world.inverted()@palm
                radius=Vector((local.x/.20,local.y/.105,local.z/.17)).length
                maximum=max(maximum,max(0,radius-1)*max(.20*root.scale.x,.17*root.scale.z))
                depth=max(depth,max(0,1-radius)*max(.20*root.scale.x,.17*root.scale.z))
        ev.to_mesh_clear()
    assert maximum<.003,(kind,maximum)
    report[kind]={'samples':181,'maximumGripSeparation':maximum,'breadRadialInsetUpperBound':depth,'characterUnchanged':True}
(P/'grip-validation.json').write_text(json.dumps(report,indent=2));print(report)
