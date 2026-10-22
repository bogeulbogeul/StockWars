import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
old=bpy.data.objects['Somangi_SmoothBody'];base=np.array([tuple(v.co) for v in old.data.vertices])
uv=np.array([tuple(v.uv) for v in old.data.uv_layers.active.data]);n=len(base)
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop'];mouth=bpy.data.objects['Somangi_AnimatedMouth']
meta=json.loads((P/'metadata.json').read_text())
assert np.max(np.abs(np.array([tuple(v.co) for v in body.data.vertices])[:n]-base))==0
assert np.max(np.abs(np.array([tuple(v.uv) for v in body.data.uv_layers.active.data])[:len(uv)]-uv))==0
maximum=0;heights=[]
for i in range(181):
    frame=1+i*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    coords=np.empty(len(m.vertices)*3,dtype=np.float32);m.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
    for side,ids in meta['palmVertexIds'].items():
        palm=Vector(coords[ids].mean(0));target=root.matrix_world@Vector(meta['gripAnchors'][side])
        maximum=max(maximum,(palm-target).length)
    assert np.isfinite(coords).all();ev.to_mesh_clear()
    ev=mouth.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
    heights.append(max(v.co.z for v in m.vertices)-min(v.co.z for v in m.vertices));ev.to_mesh_clear()
assert maximum<.004,maximum
assert max(heights)>.065 and heights[0]<.05 and heights[-1]<.05,heights
report={'samples':181,'maximumTwoHandGripError':maximum,'originalSurfaceDisplacement':0,'originalUvDisplacement':0,
    'mouthHeightMin':min(heights),'mouthHeightMax':max(heights),'mouthClosesAtEnd':True,'beverageIncluded':False,
    'restCapProtrusion':meta['preservation']['maximumRestCapProtrusion'],'singleEatingClip':True}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
