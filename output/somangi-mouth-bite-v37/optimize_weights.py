import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];scene=bpy.context.scene;mesh=body.data
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text());connections=json.loads((P.parent/'somangi-soft-connections-v36/connections.json').read_text())
armids={name:set(connections[name]['ids'])|{v.index for v in mesh.vertices if any(g.group==body.vertex_groups[name].index and g.weight>1e-6 for g in v.groups)} for name in ['Arm.L','Arm.R']}
mesh.calc_loop_triangles();rest=np.array([v.co[:] for v in mesh.vertices]);tri=np.array([t.vertices[:] for t in mesh.loop_triangles if mesh.polygons[t.polygon_index].material_index==0 and any(-.35<rest[i,2]<.04 for i in t.vertices)])
normal=np.cross(rest[tri[:,1]]-rest[tri[:,0]],rest[tri[:,2]]-rest[tri[:,0]]);valid=np.linalg.norm(normal,axis=1)>2e-7;tri=tri[valid];normal=normal[valid]
names=['Body','Arm.L','Arm.R','Head'];weights={name:np.zeros(len(rest)) for name in names}
for v in mesh.vertices:
    for g in v.groups:weights[body.vertex_groups[g.group].name][v.index]=g.weight
adj=[set() for _ in rest]
for edge in mesh.edges:
    a,b=edge.vertices;adj[a].add(b);adj[b].add(a)
for name,key in [('Arm.L','1'),('Arm.R','2')]:
    anchor=Vector(meta['centers'][key]);axis=(Vector(meta['palms'][key])-anchor).normalized()
    for i in armids[name]:
        t=np.clip(((mesh.vertices[i].co-anchor).dot(axis)-.01)/.17,0,1);w=float(t*t*t*(10-15*t+6*t*t));weights[name][i]=w;weights['Head'][i]=1-w;weights['Body'][i]=0
frames=[1,46,48,50,52,74,80,82,112,125];transforms={}
for f in frames:
    scene.frame_set(f);transforms[f]={name:np.array(rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted()) for name in names}
hom=np.column_stack((rest,np.ones(len(rest))));result={}
for name,ids in armids.items():
    faces=tri[np.array([all(i in ids for i in face) for face in tri])];n=np.cross(rest[faces[:,1]]-rest[faces[:,0]],rest[faces[:,2]]-rest[faces[:,0]]);a2=np.sum(n*n,axis=1)
    values=weights[name].copy();initial=values.copy();active=np.zeros(len(rest),dtype=bool);active[list(ids)]=True;active&=(values>1e-6)&(values<1-1e-6)
    cached=[]
    for f in frames:
        head=(hom@transforms[f]['Head'].T)[:,:3];arm=(hom@transforms[f][name].T)[:,:3];hn=n@transforms[f]['Head'][:3,:3].T;an=n@transforms[f][name][:3,:3].T;cached.append((head,arm-head,hn,an-hn))
    m=np.zeros(len(rest));v=np.zeros(len(rest));best=None
    for step in range(1,801):
        grad=np.zeros(len(rest));loss=0.;count=0;worst=1.
        for head,delta,hn,dn in cached:
            co=head+delta*values[:,None];p=co[faces];e1=p[:,1]-p[:,0];e2=p[:,2]-p[:,0];cross=np.cross(e1,e2);expected=hn+dn*values[faces].mean(axis=1)[:,None];signed=np.sum(cross*expected,axis=1)/a2
            penalty=np.minimum(signed-.04,0);loss+=float(np.sum(penalty*penalty));count+=int(np.sum(signed<0));worst=min(worst,float(signed.min()))
            g1=np.cross(e2,expected);g2=np.cross(expected,e1);g0=-g1-g2;extra=np.sum(cross*dn,axis=1)/3
            for j,gp in enumerate([g0,g1,g2]):
                derivative=(np.sum(gp*delta[faces[:,j]],axis=1)+extra)/a2;np.add.at(grad,faces[:,j],2*penalty*derivative)
        grad+=.002*(values-initial);grad[~active]=0
        if best is None or (count,loss)<best[:2]:best=(count,loss,values.copy())
        if step%50==0 or count==0:print(name,step,'INVERTED',count,'MIN',worst,flush=True)
        if count==0 and worst>.015:break
        m=.9*m+.1*grad;v=.999*v+.001*grad*grad;values=np.clip(values-.0015*(m/(1-.9**step))/(np.sqrt(v/(1-.999**step))+1e-8),0,1);values[~active]=initial[~active]
    values=best[2];result[name]=[[int(i),float(values[i])] for i in sorted(ids)];print('BEST FINAL',name,best[:2],flush=True)
(P/'optimized-arm-weights.json').write_text(json.dumps(result))
