import bpy,bmesh,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
from bridge import connect
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-continuous-shoulder-v41/somangi-eat.blend'))
scene=bpy.context.scene;scene.frame_set(136)
b=bpy.data.objects['Somangi_SmoothBody'];head=set(json.loads((P.parent/'somangi-continuous-shoulder-v41/head-indices.json').read_text()))
headcoords=[b.data.vertices[i].co.copy() for i in head]
arms=set(sum(json.loads((P.parent/'somangi-continuous-shoulder-v41/arm-vertices.json').read_text()).values(),[]))
remove=[f.index for f in b.data.polygons if f.material_index!=5 and not all(i in head for i in f.vertices) and not all(i in arms for i in f.vertices)]
print('REMOVE OLD TRANSITION FACES',len(remove),flush=True)
bm=bmesh.new();bm.from_mesh(b.data);bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm,geom=[bm.faces[i] for i in remove],context='FACES_ONLY')
bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
bm.to_mesh(b.data);bm.free();b.data.update()
from mathutils.kdtree import KDTree
tree=KDTree(len(b.data.vertices))
for v in b.data.vertices:tree.insert(v.co,v.index)
tree.balance()
head_now=[tree.find(co)[1] for co in headcoords]
connect(b,head_now)
ids={n:[v.index for v in b.data.vertices if any(g.group==b.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']}
(P/'arm-vertices.json').write_text(json.dumps(ids))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','CleanShoulder_RigidArms')
