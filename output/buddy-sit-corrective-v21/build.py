import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-chair-polish-v20/buddy-sit.blend'))
mesh=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
for mod in list(mesh.modifiers):
    if mod.type=='SMOOTH':mesh.modifiers.remove(mod)
arm=next(m for m in mesh.modifiers if m.type=='ARMATURE');arm.use_deform_preserve_volume=False
s.frame_set(61);bpy.context.view_layer.update()
rest=[v.co.copy() for v in mesh.data.vertices]
ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
coords=[v.co.copy() for v in ev.data.vertices]
neighbors=[set() for v in rest]
for e in mesh.data.edges:
    a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
mask=[]
for co in rest:
    z=co.z
    mask.append(math.sin(math.pi*(z+.82)/.25)**.65 if -.82<z<-.57 else 0)
# Relax the compressed inner hip surface, retaining the belly and sole outlines.
for iteration in range(350):
    new=[p.copy() for p in coords]
    for i,w in enumerate(mask):
        if w>.001 and neighbors[i]:
            avg=sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i])
            new[i]=coords[i].lerp(avg,.48*w)
    coords=new
basis=mesh.shape_key_add(name='Basis')
key=mesh.shape_key_add(name='Sit_Hip_Corrective')
bone_mats={pb.name:pb.matrix@pb.bone.matrix_local.inverted() for pb in rig.pose.bones}
count=0
for i,v in enumerate(mesh.data.vertices):
    if mask[i]<.001:continue
    matrix=Matrix(((0,0,0,0),)*4);total=0
    for g in v.groups:
        name=mesh.vertex_groups[g.group].name
        if name in bone_mats:
            matrix+=bone_mats[name]*g.weight;total+=g.weight
    if total>1e-6:
        matrix*=1/total
        key.data[i].co=matrix.inverted_safe()@coords[i];count+=1
for f in range(1,73):
    t=min(1,max(0,(f-12)/38));a=t*t*(3-2*t)
    key.value=a;key.keyframe_insert(data_path='value',frame=f)
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-sit-corrective.blend'))
s.render.resolution_x=540;s.render.resolution_y=540
for name,pos in [('side',(7,0,-.02)),('angle',(3,-7,1.25))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.12))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,73,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
assert all((v.co-r).length<1e-7 for v,r in zip(mesh.data.vertices,rest))
(P/'validation.json').write_text(json.dumps({'basis_unchanged':True,'corrective_vertices':count,'shape_key':'Sit_Hip_Corrective','walking_file_untouched':True},indent=2))
