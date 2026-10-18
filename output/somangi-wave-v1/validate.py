import bpy,json,math,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-wave.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Eating_Torso'];original=bpy.data.objects['Somangi_Body'];arms=[bpy.data.objects['Rigid_Arm.'+side] for side in ['L','R']]
bvh=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(p.vertices) for p in body.data.polygons],all_triangles=False)
base={o.name:[v.co.copy() for v in o.data.vertices] for o in [body,original,*arms]};ends={};body_error=0;leg_error=0;edge_error=0;overlap=100000;distance_error=0;head_intersections=0
legids=[v.index for v in original.data.vertices if v.co.z<-.73]
for f in range(1,62):
    s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();snapshot={}
    hobj=original.evaluated_get(dg);hm=hobj.to_mesh();hbvh=BVHTree.FromPolygons([v.co for v in hm.vertices],[list(p.vertices) for p in hm.polygons]);hobj.to_mesh_clear()
    for o in [body,original,*arms]:
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
            if o.name=='Rigid_Arm.L':
                for idx,p in enumerate(coords):
                    if (base[o.name][idx]-shoulder).length<.30 or p.z<.03:continue
                    near,normal,_,distance=hbvh.find_nearest(p)
                    if near is not None and (p-near).dot(normal)<-.002:head_intersections+=1
        evaluated.to_mesh_clear()
    if f in [1,61]:ends[f]=snapshot
loop=max((p-q).length for name in ends[1] for p,q in zip(ends[1][name],ends[61][name]))
print('HEAD_INTERSECTIONS',head_intersections)
assert head_intersections==0
assert body_error<1e-6 and leg_error<1e-5 and edge_error<1e-5 and loop<1e-5 and overlap>0
report={'frames':61,'duration_seconds':2.5,'torso_displacement':body_error,'feet_displacement':leg_error,'arm_edge_length_error':edge_error,'loop_error':loop,'minimum_embedded_shoulder_vertices_each_arm':overlap,'shoulder_morphs':False,'distal_arm_head_intersections':head_intersections}
data=(P/'somangi-wave.glb').read_bytes();length=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+length]);assert len(gltf['animations'])==1
assert all(c['target']['path']!='weights' for a in gltf['animations'] for c in a['channels'])
report['glb']={'animation':gltf['animations'][0].get('name'),'meshes':len(gltf['meshes']),'morph_channels':0}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-wave.glb'))
report['roundtrip']={'clips':[a.name for a in bpy.data.actions],'armatures':sum(o.type=='ARMATURE' for o in bpy.context.scene.objects)}
assert 'Wave_Happy' in report['roundtrip']['clips']
(P/'validation.json').write_text(json.dumps(report,indent=2));print('VALIDATION',json.dumps(report))
