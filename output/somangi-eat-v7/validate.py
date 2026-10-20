import bpy,json,math,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Eating_Torso'];original=bpy.data.objects['Somangi_Body'];arms=[bpy.data.objects['Rigid_Arm.'+side] for side in ['L','R']];mouth=bpy.data.objects['Mouth_Animated']
bvh=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(p.vertices) for p in body.data.polygons],all_triangles=False)
base={o.name:[v.co.copy() for v in o.data.vertices] for o in [body,original,*arms]};ends={};body_error=0;leg_error=0;edge_error=0;overlap=100000;distance_error=0
legids=[v.index for v in original.data.vertices if v.co.z<-.73]
for f in range(1,74):
    s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();snapshot={}
    for o in [body,original,*arms,mouth,bpy.data.objects['Mouth_Eraser']]:
        evaluated=o.evaluated_get(dg);temp=evaluated.to_mesh();coords=[v.co.copy() for v in temp.vertices];assert all(math.isfinite(c) for v in coords for c in v)
        snapshot[o.name]=coords
        if o==body:body_error=max(body_error,max((a-b).length for a,b in zip(coords,base[o.name])))
        if o==original:leg_error=max(leg_error,max((coords[i]-base[o.name][i]).length for i in legids))
        if o in arms:
            for e in o.data.edges:
                a,b=e.vertices;edge_error=max(edge_error,abs((coords[a]-coords[b]).length-(base[o.name][a]-base[o.name][b]).length))
            shoulder=rig.data.bones['Arm.'+o.name[-1]].head_local
            count=0
            for idx,p in enumerate(coords):
                if (base[o.name][idx]-shoulder).length>.17:continue
                near,normal,_,dist=bvh.find_nearest(p)
                if near is not None and (p-near).dot(normal)<-.001:count+=1
            overlap=min(overlap,count)
        evaluated.to_mesh_clear()
    if f in [1,73]:ends[f]=snapshot
loop=max((p-q).length for name in ends[1] for p,q in zip(ends[1][name],ends[73][name]))
assert body_error<1e-6 and leg_error<1e-5 and edge_error<1e-5 and loop<1e-5 and overlap>0
report={'frames':73,'duration_seconds':3,'torso_displacement':body_error,'feet_displacement':leg_error,'arm_edge_length_error':edge_error,'loop_error':loop,'minimum_embedded_shoulder_vertices_each_arm':overlap,'shoulder_morphs':False}
data=(P/'somangi-eat.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+length]);assert len(gltf['animations'])==1
paths={c['target']['path'] for a in gltf['animations'] for c in a['channels']};assert {'weights','rotation','translation'}.issubset(paths)
report['glb']={'animation':gltf['animations'][0].get('name'),'meshes':len(gltf['meshes']),'mouth_morphs':3,'combined_bones_and_morphs':True}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
report['roundtrip']={'clips':[a.name for a in bpy.data.actions],'armatures':sum(o.type=='ARMATURE' for o in bpy.context.scene.objects)}
assert 'Eat' in report['roundtrip']['clips']
assert any(o.type=='MESH' and o.data.shape_keys and 'Mouth_Open' in o.data.shape_keys.key_blocks for o in bpy.context.scene.objects)
assert any(o.type=='MESH' and o.data.shape_keys and 'Hide_Overlay' in o.data.shape_keys.key_blocks for o in bpy.context.scene.objects)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('VALIDATION',json.dumps(report))
