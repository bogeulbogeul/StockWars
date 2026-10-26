import bpy,bmesh,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];head=set(json.loads((P/'head-indices.json').read_text()))
bm=bmesh.new();bm.from_mesh(b.data);bm.verts.ensure_lookup_table()
headfaces={f for f in bm.faces if all(v.index in head for v in f.verts)}
rim=[e for e in bm.edges if sum(f in headfaces for f in e.link_faces)==1 and all(v.co.z<.06 for v in e.verts)]
assert len(rim)>250
assert all(len(e.link_faces)==2 and any(f.material_index==5 for f in e.link_faces) for e in rim)
shared=len(rim);bm.free()
b.data.calc_loop_triangles()
tri=np.array([t.vertices[:] for t in b.data.loop_triangles if b.data.polygons[t.polygon_index].material_index==5 and all(b.data.vertices[i].co.z>-.151 for i in t.vertices)])
raw=np.array([v.co[:] for v in b.data.vertices]);q=raw[tri];norm=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);area=np.linalg.norm(norm,axis=1);valid=area>1e-9;tri=tri[valid];norm=norm[valid];area=area[valid];minratio=1.;mindot=1.
for k in range(271):
 f=1+k*.5;bpy.context.scene.frame_set(int(f),subframe=f-int(f));q=points(b)[tri];n=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);a=np.linalg.norm(n,axis=1)
 minratio=min(minratio,float(np.min(a/area)));mindot=min(mindot,float(np.min(np.sum(n*norm,axis=1)/(a*area))))
print('LAST WORST',raw[tri[np.argmin(np.sum(n*norm,axis=1)/(a*area))]])
result=dict(samples=271,sharedHeadTorsoEdges=shared,openEdgesAtHeadTorsoJoin=0,bridgeTriangles=len(tri),minimumTriangleAreaRatio=minratio,minimumTriangleNormalAlignment=mindot)
(P/'connection.json').write_text(json.dumps(result,indent=2));print(result)
assert minratio>.25 and mindot>.5
