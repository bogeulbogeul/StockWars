import bpy,math,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-seat-clearance-v25/buddy-seat-clearance.blend'))
s=bpy.context.scene;s.frame_set(70);bpy.context.view_layer.update()
source=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig']
dep=bpy.context.evaluated_depsgraph_get()
data=bpy.data.meshes.new_from_object(source.evaluated_get(dep),depsgraph=dep)
obj=bpy.data.objects.new('Seated_Pose_Review',data);bpy.context.collection.objects.link(obj)
coords=[v.co.copy() for v in data.vertices]
neighbors=[set() for v in coords]
for e in data.edges:
    a,b=e.vertices;neighbors[a].add(b);neighbors[b].add(a)
mask=[]
for v in source.data.vertices:
    z=v.co.z
    mask.append(math.sin(math.pi*(z+.85)/.48)**2 if -.85<z<-.37 else 0)
for iteration in range(650):
    new=[p.copy() for p in coords]
    for i,w in enumerate(mask):
        if w>.001 and neighbors[i]:
            avg=sum((coords[j] for j in neighbors[i]),Vector())/len(neighbors[i])
            new[i]=coords[i].lerp(avg,.55*w)
    coords=new
for v,co in zip(data.vertices,coords):v.co=co
for f in data.polygons:f.use_smooth=True
for e in data.edges:e.use_edge_sharp=False
if data.has_custom_normals:data.normals_split_custom_set([(0,0,0)]*len(data.loops))
source.hide_render=True;source.hide_set(True);rig.hide_set(True)
s.frame_start=70;s.frame_end=70
for name,pos in [('side',(7,-.2,.05)),('front',(0,-7,.05)),('angle',(3,-7,1.25))]:
    cam=s.camera;cam.location=pos;cam.data.ortho_scale=2.5
    target=(0,0,-.1)
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-seat-pose-review.blend'))
(P/'notes.json').write_text(json.dumps({'stage':'static pose review only','animation':'not revised','original_model_preserved_hidden':True},indent=2))
