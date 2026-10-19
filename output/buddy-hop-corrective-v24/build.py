import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-hop-seat-v23/buddy-hop-seat.blend'))
mesh=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
keys=mesh.data.shape_keys;old=keys.key_blocks['Sit_Hip_Corrective']
# Sample several actual poses; each corrective is inverse-skinned into rest space.
rest=[v.co.copy() for v in mesh.data.vertices]
neighbors=[set() for _ in rest]
for edge in mesh.data.edges:
    a,b=edge.vertices;neighbors[a].add(b);neighbors[b].add(a)
mask=[math.sin(math.pi*(p.z+.85)/.49)**2 if -.85<p.z<-.36 else 0 for p in rest]
for frame in range(1,97):
    old.value=0;old.keyframe_insert(data_path='value',frame=frame)
correctives=[]
for sample in [32,36,40,44,50]:
    s.frame_set(sample);bpy.context.view_layer.update()
    coords=[v.co.copy() for v in mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
    for iteration in range(300):
        new=[v.copy() for v in coords]
        for i,w in enumerate(mask):
            if w>.001 and neighbors[i]:
                avg=sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i])
                new[i]=coords[i].lerp(avg,.48*w)
        coords=new
    mats={pb.name:pb.matrix@pb.bone.matrix_local.inverted() for pb in rig.pose.bones}
    key=mesh.shape_key_add(name=f'Hip_Pose_{sample}');correctives.append((sample,key))
    for i,v in enumerate(mesh.data.vertices):
        if mask[i]<.001:continue
        matrix=Matrix(((0,0,0,0),)*4);total=0
        for g in v.groups:
            name=mesh.vertex_groups[g.group].name
            if name in mats:matrix+=mats[name]*g.weight;total+=g.weight
        if total:
            matrix*=1/total;key.data[i].co=matrix.inverted_safe()@coords[i]
    key.value=0
times=[22]+[f for f,k in correctives]
for f in range(1,97):
    weights=[0]*len(correctives)
    if f>=50:weights[-1]=1
    elif f>22:
        for i in range(len(times)-1):
            if times[i]<=f<times[i+1]:
                t=(f-times[i])/(times[i+1]-times[i]);t=t*t*(3-2*t)
                if i>0:weights[i-1]=1-t
                weights[i]=t;break
    for (_,key),w in zip(correctives,weights):
        key.value=w;key.keyframe_insert(data_path='value',frame=f)
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-hop-corrected.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos,target in [('front',(0,-7,.05),(0,0,.05)),('side',(7,-.2,.05),(0,-.2,-.15))]:
    cam=s.camera;cam.location=pos;cam.data.ortho_scale=2.75
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
(P/'validation.json').write_text(json.dumps({'corrective_samples':times[1:],'basis_unchanged':all((v.co-r).length<1e-7 for v,r in zip(mesh.data.vertices,rest)),'original_walk_untouched':True},indent=2))
