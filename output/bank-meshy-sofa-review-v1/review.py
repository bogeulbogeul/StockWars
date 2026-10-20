import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path('C:/GitHub/StockWars/output/bank-meshy-sofa-review-v1')
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/bank-waiting-sofa-band-v22/Bank-waiting-room-preview.blend')
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Cedar_Haven_Sofa_1020184130_texture.glb')
added=set(bpy.context.scene.objects)-before
meshes=[o for o in added if o.type=='MESH']
coords=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=Vector([min(v[i] for v in coords) for i in range(3)]);hi=Vector([max(v[i] for v in coords) for i in range(3)])
center=(lo+hi)/2
for o in before:
 if o.type in {'MESH','CURVE'}:o.hide_render=True
scene=bpy.context.scene;scene.render.resolution_x=1200;scene.render.resolution_y=1000
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=max(hi-lo)*1.5
cam.location=center+Vector((3,-5,3))*max(hi-lo)
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'meshy.png');bpy.ops.render.render(write_still=True)
report={'meshes':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'dimensions':list(hi-lo),'textures':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images if i.source=='FILE' or i.packed_file]}
(root/'inspection.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
