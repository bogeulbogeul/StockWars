import bpy,bmesh,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P/'pre-union.blend'));body=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(136);armgroups={body.vertex_groups[n].index for n in ['Arm.L','Arm.R']}
def arm(v):return any(g.group in armgroups and g.weight>.999 for g in v.groups)
parts=[]
for keep_arm in [False,True]:
 ob=body.copy();ob.data=body.data.copy();bpy.context.scene.collection.objects.link(ob);mesh=ob.data;flags=[all(arm(mesh.vertices[i]) for i in f.vertices) for f in mesh.polygons];bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[f for f,flag in zip(list(bm.faces),flags) if flag!=keep_arm],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bm.to_mesh(mesh);bm.free();parts.append(ob)
bpy.data.objects.remove(body,do_unlink=True);torso,arms=parts;bpy.ops.object.select_all(action='DESELECT');torso.select_set(True);bpy.context.view_layer.objects.active=torso;before=(len(torso.data.vertices),len(torso.data.polygons));bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');print(bpy.ops.mesh.intersect_boolean(operation='UNION',use_self=True,solver='EXACT'));bpy.ops.object.mode_set(mode='OBJECT');print('UNION',before,(len(torso.data.vertices),len(torso.data.polygons)))
arms.select_set(True);bpy.ops.object.join();torso.name='Somangi_SmoothBody';b=torso
ids={n:[v.index for v in b.data.vertices if any(g.group==b.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']};(P/'arm-vertices.json').write_text(json.dumps(ids))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','CleanSocket_RigidArms')
