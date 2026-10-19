import bpy, json
from pathlib import Path
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(Path(__file__).resolve().parents[1]/'meshy-dog-simple-v1/dog.glb'))
data=[]
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        coords=[o.matrix_world@v.co for v in o.data.vertices]
        data.append({'name':o.name,'vertices':len(coords),'bounds':[[min(v[i] for v in coords),max(v[i] for v in coords)] for i in range(3)]})
print(json.dumps(data))
