import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
results=[]
for label,file in [('earlier','Meshy_AI_Blank_Buddy_1018040345_generate.glb'),('tpose','Meshy_AI_Blank_Buddy_1018043201_generate.glb')]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(Path('C:/Users/bogeu/Downloads')/file))
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
    verts=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
    results.append({'model':label,'vertices':len(verts),'faces':sum(len(o.data.polygons) for o in objects),'bounds':[(min(v[i] for v in verts),max(v[i] for v in verts)) for i in range(3)]})
    for o in objects:
        for f in o.data.polygons:f.use_smooth=True
    bpy.ops.object.camera_add(location=(2,-7,1.15));cam=bpy.context.object
    cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=2.45
    s=bpy.context.scene;s.camera=cam;s.render.engine='BLENDER_WORKBENCH'
    s.display.shading.light='STUDIO';s.display.shading.studio_light='paint.sl'
    s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.9,.9,.9)
    s.display.shading.show_shadows=False
    s.render.resolution_x=600;s.render.resolution_y=600;s.render.resolution_percentage=100
    s.render.filepath=str(P/(label+'-source.png'));bpy.ops.render.render(write_still=True)
print(json.dumps(results))
