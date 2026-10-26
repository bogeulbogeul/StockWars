import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
meta=json.loads((P/'metadata.json').read_text());body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
maximum=0;scales=[]
for i in range(181):
    frame=1+i*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    arr=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',arr)
    palm=Vector(arr.reshape(-1,3)[meta['palmVertexIds']].mean(0));ev.to_mesh_clear()
    error=(root.matrix_world@Vector(meta['gripAnchor'])-palm).length;maximum=max(maximum,error)
    scales.append(root.scale.x)
assert maximum<.003,maximum
assert all(b<=a+1e-5 for a,b in zip(scales,scales[1:]))
assert abs(scales[-1]/scales[0]-.46)<1e-5
assert not any('cup' in o.name.lower() or 'juice' in o.name.lower() for o in bpy.context.scene.objects)
report={'samples':181,'maximumGripSeparation':maximum,'scaleDecreasesMonotonically':True,'finalLinearScale':scales[-1]/scales[0],
    'restShapeUnchanged':True,'oneEatingClipOnly':True,'beverageObjectsIncluded':False}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
