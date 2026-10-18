import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Bench.glb')
report=[];points=[]
for o in bpy.context.scene.objects:
    if o.type!='MESH':continue
    verts=[o.matrix_world@v.co for v in o.data.vertices];points+=verts
    report.append({'name':o.name,'vertices':len(verts),'bounds':[[min(v[i] for v in verts),max(v[i] for v in verts)] for i in range(3)]})
(P/'bench-inspection.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
lo=Vector([min(v[i] for v in points) for i in range(3)]);hi=Vector([max(v[i] for v in points) for i in range(3)]);mid=(lo+hi)/2
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=12
s.render.resolution_x=800;s.render.resolution_y=600;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[1].default_value=.8
span=max(hi-lo)
for offset in [(2,-3,4),(-3,-2,2)]:
    bpy.ops.object.light_add(type='AREA',location=mid+Vector(offset)*span)
    l=bpy.context.object;l.data.energy=500*span*span;l.data.size=span*3
    l.rotation_euler=(mid-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=mid+Vector((2,-3,1.6))*span)
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=span*1.4;cam.rotation_euler=(mid-cam.location).to_track_quat('-Z','Y').to_euler();s.camera=cam
s.render.filepath=str(P/'bench.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'bench-inspection.blend'))
