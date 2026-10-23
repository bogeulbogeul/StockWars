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
        t=np.clip(((mesh.vertices[i].co-anchor).dot(axis)+.06)/.30,0,1);w=float(t*t*t*(10-15*t+6*t*t));weights[name][i]=w;weights['Head'][i]=1-w;weights['Body'][i]=0
frames=[1,46,50,80,82,112];transforms={}
for f in frames:
    scene.frame_set(f);transforms[f]={name:np.array(rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted()) for name in names}
hom=np.column_stack((rest,np.ones(len(rest))));best=None
for step in range(80):
    bad=set();counts=[]
    for f in frames:
        co=sum((hom@transforms[f][name].T)[:,:3]*weights[name][:,None] for name in names);cross=np.cross(co[tri[:,1]]-co[tri[:,0]],co[tri[:,2]]-co[tri[:,0]]);expected=sum((normal@transforms[f][name][:3,:3].T)*weights[name][tri].mean(axis=1)[:,None] for name in names)
        ids=np.flatnonzero(np.sum(cross*expected,axis=1)<0);counts.append(len(ids));bad.update(ids.tolist())
    score=sum(counts)
    if best is None or score<best[0]:best=(score,{name:w.copy() for name,w in weights.items()});print('BEST',step,counts,flush=True)
    if score==0:break
    for name in ['Arm.L','Arm.R']:
        values=weights[name];targets={};ids=armids[name]
        for face in bad:
            vertices=tri[face];inside=[i for i in vertices if i in ids]
            if len(inside)!=3:continue
            value=float(values[vertices].mean())
            for i in vertices:targets.setdefault(i,[]).append(value)
        updates={i:.15*values[i]+.85*np.mean(v) for i,v in targets.items()}
        halo={j for i in targets for j in adj[i] if j in ids and j not in targets and 1e-6<values[j]<1-1e-6}
        for i in halo:updates[i]=.95*values[i]+.05*np.mean([values[j] for j in adj[i] if j in ids])
        for i,w in updates.items():values[i]=w;weights['Head'][i]=1-w
weights=best[1];result={name:[[int(i),float(weights[name][i])] for i in sorted(ids)] for name,ids in armids.items()};(P/'optimized-arm-weights.json').write_text(json.dumps(result));print('FINAL',best[0])
