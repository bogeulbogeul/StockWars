import bpy,bmesh,json
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
rig.data.pose_position='POSE';cam=s.camera;target=Vector((0,0,.1));cam.data.ortho_scale=2.6;s.render.resolution_x=700;s.render.resolution_y=700
for name,action,frame,pos in [('front','Walk_InPlace',7,(0,-5,.3)),('side','Walk_InPlace',7,(5,0,.3)),('seated','Seated',1,(2.8,-5,.6))]:
 rig.animation_data.action=bpy.data.actions[action];s.frame_set(frame);cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-meshy-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-meshy-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-meshy-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
s.render.resolution_x=420;s.render.resolution_y=420;cam.location=(2.8,-5,.5);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for action,count,step,prefix in [('Walk_InPlace',25,2,'walk'),('Sit_Demo',97,4,'sit')]:
 rig.animation_data.action=bpy.data.actions[action]
 for f in range(1,count,step):s.frame_set(f);s.render.filepath=str(P/(prefix+'-%03d.png'%f));bpy.ops.render.render(write_still=True)
