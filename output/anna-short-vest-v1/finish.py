import bpy,bmesh,json,hashlib,struct
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-short-vest.blend'));o=bpy.data.objects['Anna_Vest'];rig=bpy.data.objects['Somangi_Rig']
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0);boundaries=sum(e.is_boundary for e in bm.edges);bm.to_mesh(o.data);bm.free()
report={'vest_vertices':len(o.data.vertices),'vest_boundary_edges':boundaries,'vest_rest_bottom':min(v.co.z for v in o.data.vertices),'source':'native garment modeled on Somangi torso'}
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
def hashes():
 return {n:hashlib.sha256(b''.join(struct.pack('3f',*v.co) for v in bpy.data.objects[n].data.vertices)).hexdigest() for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf']}
new=hashes();bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-sit-v1/Anna-sit.blend'));report['body_leaf_vertices_unchanged']=hashes()==new;assert report['body_leaf_vertices_unchanged']
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-short-vest.glb'));report['clips']=[a.name for a in bpy.data.actions];assert len(report['clips'])==8
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
