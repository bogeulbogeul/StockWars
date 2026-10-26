import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
def audit(file):
 bpy.ops.wm.open_mainfile(filepath=str(file));body=bpy.data.objects['Somangi_SmoothBody'];m=body.data;m.calc_loop_triangles()
 raw=np.array([v.co[:] for v in m.vertices]);tri=np.array([t.vertices[:] for t in m.loop_triangles]);points=raw[tri]
 region=(points[:,:,2].max(1)<-.50)&(points[:,:,2].min(1)>-.73)&(abs(points[:,:,0]).max(1)<.2)
 tri=tri[region];points=raw[tri];ref=np.cross(points[:,1]-points[:,0],points[:,2]-points[:,0]);sizes=np.linalg.norm(ref,axis=1)
 valid=sizes>1e-12;tri=tri[valid];ref=ref[valid];sizes=sizes[valid]
 flips=[];minDots=[];centreFlips=[]
 centre=abs(raw[tri].mean(1)[:,0])<.02
 for frame in range(1,32):
  bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();p=np.array([v.co[:] for v in mesh.vertices]);ev.to_mesh_clear()
  q=p[tri];normal=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0]);dot=(normal*ref).sum(1)/np.maximum(np.linalg.norm(normal,axis=1)*sizes,1e-20)
  flips.append(int((dot<0).sum()));minDots.append(float(dot.min()))
  centreFlips.append(int(((dot<0)&centre).sum()))
 # A >90 degree normal turn away from the centre is diagnostic, not a mesh hole.
 # Check the actual former centre slit plus the presence of open lower-body edges.
 edges={}
 for face in m.polygons:
  for a,b in face.edge_keys:edges[(min(a,b),max(a,b))]=edges.get((min(a,b),max(a,b)),0)+1
 openEdges=sum(count==1 and max(raw[a,2],raw[b,2])<-.45 for (a,b),count in edges.items())
 return dict(triangles=len(tri),maxNormalTurnsOver90=max(flips),maxCentreNormalTurnsOver90=max(centreFlips),openLowerEdges=openEdges,minNormalDot=min(minDots)),raw
before,_=audit(P/'before.blend')
after,raw=audit(P.parent/'somangi-game-v1/somangi-walk.blend')
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rear-junction-v43/somangi-eat.blend'))
original=np.array([v.co[:] for v in bpy.data.objects['Somangi_SmoothBody'].data.vertices])
report=dict(frames=31,before=before,after=after,restVerticesIdentical=bool(np.array_equal(raw,original)))
print(report);(P/'hip-verification.json').write_text(json.dumps(report,indent=2))
assert report['restVerticesIdentical']
assert after['maxCentreNormalTurnsOver90']==0,report
assert after['openLowerEdges']==0,report
