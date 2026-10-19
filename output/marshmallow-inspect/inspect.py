import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Marshmallow_Buddy_1018045727_generate.glb')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
report=[]
for o in meshes:
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    vs=o.data.vertices;adj=[[] for v in vs]
    for e in o.data.edges:
        a,b=e.vertices;adj[a].append(b);adj[b].append(a)
    seen=set();sizes=[]
    for i in range(len(vs)):
        if i in seen:continue
        stack=[i];seen.add(i);count=0
        while stack:
            k=stack.pop();count+=1
            for j in adj[k]:
                if j not in seen:seen.add(j);stack.append(j)
        sizes.append(count)
    report.append({'name':o.name,'vertices':len(vs),'faces':len(o.data.polygons),'components':sorted(sizes,reverse=True),'bounds':[(min(v.co[i] for v in vs),max(v.co[i] for v in vs)) for i in range(3)]})
    for f in o.data.polygons:f.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(P/'original.blend'))
points=[v.co for o in meshes for v in o.data.vertices]
lo=min(v.z for v in points);hi=max(v.z for v in points);mid=(lo+hi)/2
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.studio_light='paint.sl'
s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.9,.9,.9);s.display.shading.show_shadows=False
s.render.resolution_x=700;s.render.resolution_y=700;s.render.resolution_percentage=100
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=(hi-lo)*1.2;s.camera=cam
for name,pos in [('front',(0,-7,mid)),('angle',(3,-7,mid+.7)),('side',(7,0,mid))]:
    cam.location=pos;cam.rotation_euler=(Vector((0,0,mid))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
