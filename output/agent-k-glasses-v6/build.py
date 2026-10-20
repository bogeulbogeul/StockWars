import bpy, math, json, hashlib, struct, bmesh
from pathlib import Path
from mathutils import Vector

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'agent-k-flat-mouth-v5/Agent-K.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig']
def snapshot():
    return {o.name:hashlib.sha256(b''.join(struct.pack('3f',*v.co) for v in o.data.vertices)).hexdigest()
            for o in bpy.data.objects if o.type=='MESH' and not o.name.startswith('Glasses')}
before=snapshot();parts=[]
for sign in [-1,1]:
    old=bpy.data.objects['Glasses rim '+str(sign)];mat=old.data.materials[0]
    bpy.data.objects.remove(old,do_unlink=True)
    verts=[];faces=[];U=192;V=32
    for i in range(U):
        a=i*math.tau/U
        for j in range(V):
            b=j*math.tau/V;r=.019*math.cos(b)
            verts.append((sign*.22+(.167+r)*math.cos(a),-.536+.019*math.sin(b),.39+(.173+r)*math.sin(a)))
    for i in range(U):
        for j in range(V):faces.append((i*V+j,((i+1)%U)*V+j,((i+1)%U)*V+(j+1)%V,i*V+(j+1)%V))
    mesh=bpy.data.meshes.new('Continuous closed elliptical rim');mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
    o=bpy.data.objects.new('Glasses rim '+str(sign),mesh);bpy.context.collection.objects.link(o);parts.append(o)
bridge=bpy.data.objects['Glasses bridge']
bridge.modifiers.clear();bridge.vertex_groups.clear();bridge.parent=None
parts.append(bridge)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name='Glasses smooth frame'
# Fuse the bridge into both rims, removing overlap lines and open tube endpoints.
mod=o.modifiers.new('Continuous bridge junctions','REMESH');mod.mode='VOXEL';mod.voxel_size=.0015;mod.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=o.modifiers.new('Polished frame surface','SMOOTH');mod.factor=.55;mod.iterations=4
bpy.ops.object.modifier_apply(modifier=mod.name)
for p in o.data.polygons:p.use_smooth=True
o.parent=rig;g=o.vertex_groups.new(name='Head');g.add(list(range(len(o.data.vertices))),1,'REPLACE')
mod=o.modifiers.new('Shared Head','ARMATURE');mod.object=rig
bm=bmesh.new();bm.from_mesh(o.data);boundaries=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
assert boundaries==0 and nonmanifold==0 and snapshot()==before
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for q in rig.children_recursive:
    if q.type=='MESH':q.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Agent-K.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Agent-K.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
s.render.resolution_x=800;s.render.resolution_y=900;s.render.resolution_percentage=100;s.cycles.samples=32
for name,pos,target,scale in [('face-close',(1,-6,.5),(0,0,.41),1.45),('front',(0,-6,.32),(0,0,.25),2.9)]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Agent-K.glb'))
assert bpy.data.objects.get('Glasses smooth frame')
(P/'validation.json').write_text(json.dumps({'closed_frame_boundary_edges':boundaries,'nonmanifold_edges':nonmanifold,'other_mesh_coordinates_unchanged':True,'glb_reimport_ok':True},indent=2))
