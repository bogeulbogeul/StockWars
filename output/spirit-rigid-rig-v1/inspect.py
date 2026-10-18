import bpy, json
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\bogeu\Downloads\Meshy_AI_Blank_Buddy_1018040345_generate.glb')
for o in bpy.context.scene.objects:
    if o.type != 'MESH': continue
    bpy.context.view_layer.objects.active=o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    vs=[v.co for v in o.data.vertices]
    print('MODEL',o.name,len(vs),'BOUNDS',[(min(v[i] for v in vs),max(v[i] for v in vs)) for i in range(3)])
    for z in [i/20 for i in range(21)]:
        lo=min(v.z for v in vs); hi=max(v.z for v in vs)
        sl=[v for v in vs if abs(v.z-(lo+z*(hi-lo)))<(hi-lo)*.008]
        if sl: print('SLICE',round(z,2),[(round(min(v[i] for v in sl),4),round(max(v[i] for v in sl),4)) for i in [0,1]])
bpy.ops.wm.save_as_mainfile(filepath=r'C:\GitHub\StockWars\output\spirit-rigid-rig-v1\source.blend')
