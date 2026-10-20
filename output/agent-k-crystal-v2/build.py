import bpy, math, json, hashlib, struct
from pathlib import Path
from mathutils import Vector

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'agent-k-model-v1/Agent-K.blend'))
s=bpy.context.scene; rig=bpy.data.objects['Somangi_Rig']
o=bpy.data.objects['AgentK_Crystal']
def snapshot():
    return {q.name:hashlib.sha256(b''.join(struct.pack('3f',*v.co) for v in q.data.vertices)).hexdigest()
            for q in bpy.data.objects if q.type=='MESH' and q!=o}
before=snapshot()
# Tall crown and short, truncated lower pavilion seated in the existing collar.
verts=[(0,0,1.55)]
for z,rx,ry in [(1.205,.235,.19),(.985,.125,.115)]:
    for i in range(6):
        a=math.tau*i/6
        verts.append((rx*math.cos(a),ry*math.sin(a),z))
faces=[]
for i in range(6):
    j=(i+1)%6
    faces.append((0,i+1,j+1))
    # Alternating cuts produce visible triangular facets around the short base.
    if i%2:
        faces.extend([(i+1,i+7,j+1),(j+1,i+7,j+7)])
    else:
        faces.extend([(i+1,i+7,j+7),(i+1,j+7,j+1)])
faces.append(tuple(range(12,6,-1)))
mesh=bpy.data.meshes.new('K tall crown triangular crystal v2')
mesh.from_pydata(verts,[],faces); mesh.update(); o.data=mesh
def linear(v):return ((v+.055)/1.055)**2.4 if v>.04045 else v/12.92
palette=[(.50,.70,.97),(.64,.82,1),(.40,.60,.91),(.56,.76,.98),(.35,.54,.87),(.71,.86,1)]
for i,rgb in enumerate(palette):
    m=bpy.data.materials.new('Crystal blue facet '+str(i));m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=tuple(map(linear,rgb))+(1,)
    bs.inputs['Roughness'].default_value=.34
    mesh.materials.append(m)
for i,p in enumerate(mesh.polygons):
    p.material_index=([0,2,4,1,0,2,3,4,0,5,2,3,1,0,4,3,2,1,2][i])
    p.use_smooth=False
# The vertex count changed: rebuild the accessory's single-bone assignment.
o.vertex_groups.clear();g=o.vertex_groups.new(name='Head');g.add(list(range(len(verts))),1,'REPLACE')
assert snapshot()==before
rig.animation_data.action=None
for pb in rig.pose.bones:
    pb.location=(0,0,0);pb.rotation_quaternion=(1,0,0,0);pb.scale=(1,1,1)
s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for q in rig.children_recursive:
    if q.type=='MESH':q.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Agent-K.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Agent-K.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
s.render.resolution_x=800;s.render.resolution_y=900;s.render.resolution_percentage=100;s.cycles.samples=32
cam=s.camera;cam.data.ortho_scale=2.9
for name,pos,target,scale in [('front',(0,-6,.32),(0,0,.25),2.9),('three-quarter',(3,-6,.7),(0,0,.25),2.9),('crystal-close',(0,-6,1.27),(0,0,1.27),.75)]:
    cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
report={'other_mesh_coordinates_unchanged':snapshot()==before,'crystal_vertices':len(verts),'crystal_faces':len(faces),'crown_height':.345,'lower_height':.22}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Agent-K.glb'))
assert bpy.data.objects.get('AgentK_Crystal')
report['glb_reimport_ok']=True
(P/'validation.json').write_text(json.dumps(report,indent=2))
