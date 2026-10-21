from pathlib import Path
P=Path('C:/GitHub/StockWars/output/anna-meshy-short-vest-v6')
source=(P.parent/'anna-meshy-short-vest-v5/build.py').read_text(encoding='utf-8-sig')
tail="rig.data.pose_position='POSE';cam="+source.split("rig.data.pose_position='POSE';cam=",1)[1]
head='''import bpy,bmesh,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v5/Anna-meshy-short-vest.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];o=bpy.data.objects['Anna_Vest']
# Weld duplicated UV-seam positions before smoothing, retaining loop UVs.
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
original={v:v.co.copy() for v in bm.verts}
for _ in range(6):
 bmesh.ops.smooth_vert(bm,verts=list(bm.verts),factor=.35,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 bmesh.ops.smooth_vert(bm,verts=list(bm.verts),factor=-.36,use_axis_x=True,use_axis_y=True,use_axis_z=True)
maximum=0
for v in bm.verts:
 delta=v.co-original[v];worlddelta=o.matrix_world.to_3x3()@delta
 if worlddelta.length>.003:v.co=original[v]+delta*(.003/worlddelta.length)
 maximum=max(maximum,(o.matrix_world.to_3x3()@(v.co-original[v])).length)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
if o.data.has_custom_normals:o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
for f in o.data.polygons:f.use_smooth=True
# Remove baked/normal-map creases and use clean matte olive cloth.
mat=bpy.data.materials.new('Anna freshly pressed olive vest');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
def linear(x):return ((x+.055)/1.055)**2.4 if x>.04045 else x/12.92
bs.inputs['Base Color'].default_value=tuple(linear(v) for v in [.61,.65,.29])+(1,);bs.inputs['Roughness'].default_value=.82
o.data.materials.clear();o.data.materials.append(mat)
for f in o.data.polygons:f.material_index=0
o.vertex_groups.clear();g=o.vertex_groups.new(name='Body');g.add(list(range(len(o.data.vertices))),1,'REPLACE')
(P/'validation.json').write_text(json.dumps({'maximum_surface_adjustment':maximum,'normal_map_removed':True,'clean_matte_material':True},indent=2))
'''
(P/'build.py').write_text(head+tail,encoding='utf-8')
