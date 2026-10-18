from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'spirit-walk-original-v4/build.py').read_text(encoding='utf-8')
fix='''
# Local relaxation only at shoulder/hip transitions, preserving head and limb tips.
neighbors=[set() for v in mesh.data.vertices]
for edge in mesh.data.edges:
    a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
mask=[]
for vertex in mesh.data.vertices:
    x,y,z=vertex.co
    shoulder=math.exp(-((abs(x)-.345)/.075)**2-((z+.16)/.14)**2) if z<-.035 else 0
    hip=math.exp(-((abs(x)-.19)/.095)**2-((z+.59)/.07)**2)
    mask.append(max(shoulder,hip)*.25)
coords=[v.co.copy() for v in mesh.data.vertices]
for iteration in range(20):
    new=[p.copy() for p in coords]
    for i,w in enumerate(mask):
        if w>.002 and neighbors[i]:
            avg=sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i])
            new[i]=coords[i].lerp(avg,w)
    coords=new
max_change=max((v.co-co).length for v,co in zip(mesh.data.vertices,coords))
for v,co in zip(mesh.data.vertices,coords):v.co=co
print('LOCAL_CONNECTION_MAX_CHANGE',max_change)
original=[tuple(v.co) for v in mesh.data.vertices]
'''
code=code.replace("original=[tuple(v.co) for v in mesh.data.vertices]",fix)
code=code.replace("arm=smooth(boundary,boundary+.105,ax)*(1-head)","arm=smooth(boundary-.025,boundary+.12,ax)")
code=code.replace("leg=smooth(-.49,-.70,z)*smooth(.015,.13,ax)","leg=smooth(-.51,-.72,z)*smooth(.025,.15,ax)")
code=code.replace("'Walk_Gentle'","'Walk_Soft_Connections'")
code=code.replace("8*s","9*s").replace("-8*s","-9*s")
code=code.replace("buddy-gentle-walk","buddy-soft-connections")
code=code.replace("'original_vertices_unchanged':True","'rest_mesh_preserved_after_local_connection_cleanup':True")
code=code.replace("original geometry unchanged","localized connection cleanup; rest geometry unchanged by rigging")
exec(compile(code,str(P/'generated-build.py'),'exec'))
