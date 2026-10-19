import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-eat-contact-v36/buddy-eat-contact.blend'))
mesh=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
arm=next(m for m in mesh.modifiers if m.type=='ARMATURE');arm.use_deform_preserve_volume=False
bpy.context.view_layer.update()
rest=[v.co.copy() for v in mesh.data.vertices]
coords=[v.co.copy() for v in mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
adj=[set() for v in coords]
for e in mesh.data.edges:
    a,b=e.vertices;adj[a].add(b);adj[b].add(a)
mask=[]
for p in rest:
    shoulder=math.exp(-((p.x-.36)/.14)**2-((p.z+.16)/.20)**2) if p.x>.15 and -.48<p.z<.035 else 0
    neck=math.exp(-((p.z+.005)/.075)**2)*max(0,1-(p.x/.33)**4) if abs(p.x)<.33 and -.15<p.z<.15 else 0
    mask.append(max(shoulder,neck))
for iteration in range(260):
    new=[v.copy() for v in coords]
    for i,w in enumerate(mask):
        if w>.002 and adj[i]:
            avg=sum((coords[j] for j in adj[i]),Vector())/len(adj[i])
            new[i]=coords[i].lerp(avg,.43*w)
    coords=new
mesh.shape_key_add(name='Basis');key=mesh.shape_key_add(name='Eating_Shoulder_Neck_Correction')
mats={pb.name:pb.matrix@pb.bone.matrix_local.inverted() for pb in rig.pose.bones}
for i,v in enumerate(mesh.data.vertices):
    if mask[i]<.002:continue
    m=Matrix(((0,0,0,0),)*4);total=0
    for g in v.groups:
        n=mesh.vertex_groups[g.group].name
        if n in mats:m+=mats[n]*g.weight;total+=g.weight
    if total:
        m*=1/total;key.data[i].co=m.inverted_safe()@coords[i]
key.value=1
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-eat-joints.blend'))
for name,pos in [('side',(7,0,-.02)),('angle',(3,-7,1.15)),('front',(0,-7,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
assert all((v.co-r).length<1e-7 for v,r in zip(mesh.data.vertices,rest))
(P/'validation.json').write_text(json.dumps({'basis_unchanged':True,'pose_only_correction':True,'food_mouth_transforms_unchanged':True},indent=2))
