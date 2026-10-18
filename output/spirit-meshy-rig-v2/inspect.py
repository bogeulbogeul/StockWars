import bpy
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'source.glb'))
for o in bpy.context.scene.objects:
    if o.type!='MESH':continue
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    vs=[v.co for v in o.data.vertices]
    print('MESH',o.name,len(vs),'BOUNDS',[(min(v[i] for v in vs),max(v[i] for v in vs)) for i in range(3)])
    adj=[[] for _ in vs]
    for e in o.data.edges:
        a,b=e.vertices;adj[a].append(b);adj[b].append(a)
    seen=set();components=[]
    for i in range(len(vs)):
        if i in seen:continue
        stack=[i];seen.add(i);ids=[]
        while stack:
            k=stack.pop();ids.append(k)
            for n in adj[k]:
                if n not in seen:seen.add(n);stack.append(n)
        components.append(ids)
    for ids in sorted(components,key=len,reverse=True)[:8]:
        print('COMPONENT',len(ids),[(min(vs[k][j] for k in ids),max(vs[k][j] for k in ids)) for j in range(3)])
    for z in [-.85,-.65,-.5,-.35,-.2,-.1,0,.1,.3,.5]:
        sl=[v for v in vs if abs(v.z-z)<.012]
        if sl:print('SLICE',z,[(min(v[i] for v in sl),max(v[i] for v in sl)) for i in [0,1]])
bpy.ops.wm.save_as_mainfile(filepath=str(P/'source.blend'))
