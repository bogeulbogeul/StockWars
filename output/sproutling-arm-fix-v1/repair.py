import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'welded.blend'))
o=next(o for o in bpy.data.objects if o.type=='MESH')
# Add exact intersection edges while preserving existing UV and material data.
bm=bmesh.new();bm.from_mesh(o.data)
for point,normal in [((.075,0,0),(1,0,.5)),((-.075,0,0),(-1,0,.5)),((0,.18,0),(0,1,0)),((0,0,-.20),(0,0,1))]:
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=point,plane_no=normal)
bm.to_mesh(o.data);bm.free()
source=o.data.copy()
cap=bpy.data.materials.new('New hidden inner surfaces - cream');cap.diffuse_color=(.86,.81,.69,1);cap.use_nodes=True
bs=cap.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.86,.81,.69,1);bs.inputs['Roughness'].default_value=.85

def region(co):
 if co.z<-.199999 and co.y<.180001:
  if co.x+.5*co.z>.075-1e-7:return 'Arm.L'
  if -co.x+.5*co.z>.075-1e-7:return 'Arm.R'
 return 'Body'
objects=[];report=[]
for label in ['Body','Arm.L','Arm.R']:
 mesh=source.copy();obj=bpy.data.objects.new(label,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(cap)
 bm=bmesh.new();bm.from_mesh(mesh)
 discard=[f for f in bm.faces if region(f.calc_center_median())!=label]
 bmesh.ops.delete(bm,geom=discard,context='FACES')
 bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
 edges=[e for e in bm.edges if e.is_boundary]
 filled=bmesh.ops.holes_fill(bm,edges=edges,sides=0).get('faces',[])
 for f in filled:f.material_index=len(mesh.materials)-1;f.smooth=True
 bmesh.ops.triangulate(bm,faces=filled)
 local_verts={v for f in filled for v in f.verts}
 for step in range(3):local_verts.update(v for e in list(local_verts) for ed in e.link_edges for v in ed.verts)
 for step in range(18):bmesh.ops.smooth_vert(bm,verts=list(local_verts),factor=.45,use_axis_x=True,use_axis_y=True,use_axis_z=True)
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 bm.to_mesh(mesh);bm.free()
 if label!='Body':
  sign=1 if label=='Arm.L' else -1
  pivot=Vector((sign*.205,.015,-.205));rot=Matrix.Rotation(math.radians(-sign*9),3,'Y')
  for v in mesh.vertices:v.co=pivot+rot@(v.co-pivot)
  # Origin at the shoulder, ready for independent rotation.
  for v in mesh.vertices:v.co-=pivot
  obj.location=pivot
 # Remove the thin fused membranes left inside the original armpits.
 reference=obj.copy();reference.data=mesh.copy();bpy.context.collection.objects.link(reference)
 bpy.context.view_layer.objects.active=obj;obj.select_set(True)
 rem=obj.modifiers.new('Close and round reconstructed inner surface','REMESH');rem.mode='VOXEL';rem.voxel_size=.009;rem.use_smooth_shade=True
 bpy.ops.object.modifier_apply(modifier=rem.name)
 smooth=obj.modifiers.new('Soften repaired surface','SMOOTH');smooth.factor=.7;smooth.iterations=30
 bpy.ops.object.modifier_apply(modifier=smooth.name)
 # Restore untouched facial, leaf and foot surfaces after local repair.
 if label=='Body':
  from mathutils.bvhtree import BVHTree
  tree=BVHTree.FromObject(reference,bpy.context.evaluated_depsgraph_get())
  for v in obj.data.vertices:
   hit=tree.find_nearest(v.co)
   if hit and not (-.66<v.co.z<-.16 and abs(v.co.x)>.14 and v.co.y<.25):v.co=hit[0]
  bm2=bmesh.new();bm2.from_mesh(obj.data)
  repair_verts=[v for v in bm2.verts if -.66<v.co.z<-.18 and abs(v.co.x)>.15 and v.co.y<.24]
  for step in range(60):bmesh.ops.smooth_vert(bm2,verts=repair_verts,factor=.5,use_axis_x=True,use_axis_y=True,use_axis_z=True)
  bm2.to_mesh(obj.data);bm2.free()
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')
 image=bpy.data.images.new(label+' baked color',width=2048,height=2048)
 mat=bpy.data.materials.new(label+' baked material');mat.use_nodes=True
 tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;mat.node_tree.nodes.active=tex
 shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.8
 mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
 obj.data.materials.clear();obj.data.materials.append(mat)
 for f in obj.data.polygons:f.material_index=0
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=4
 scene.render.bake.use_selected_to_active=True;scene.render.bake.cage_extrusion=.025;scene.render.bake.max_ray_distance=.08;scene.render.bake.margin=16
 scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
 reference.select_set(True);bpy.context.view_layer.objects.active=obj
 bpy.ops.object.bake(type='DIFFUSE')
 image.filepath_raw=str(P/(label.replace('.','-')+'-color.png'));image.file_format='PNG';image.save();image.pack()
 bpy.data.objects.remove(reference,do_unlink=True);mesh=obj.data
 for f in mesh.polygons:f.use_smooth=True
 bm=bmesh.new();bm.from_mesh(mesh)
 report.append({'object':label,'vertices':len(mesh.vertices),'faces':len(mesh.polygons),'open_edges':sum(e.is_boundary for e in bm.edges),'non_manifold_edges':sum(not e.is_manifold for e in bm.edges),'capped_faces':len(filled)})
 bm.free();objects.append(obj)
bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(P/'sproutling-arms-separated.glb'),use_selection=True,export_format='GLB')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'sproutling-arms-separated.blend'))
s=bpy.context.scene;s.render.resolution_x=900;s.render.resolution_y=900;s.display.shading.background_type='WORLD';s.world=bpy.data.worlds.new('Preview');s.world.color=(.22,.22,.22)
s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.9,.9,.9);s.display.shading.show_shadows=False
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.3;s.camera=cam;mid=0
for name,pos in [('after-front',(0,-7,mid)),('after-angle',(3,-7,mid+.5)),('after-side',(7,0,mid)),('after-back',(0,7,mid))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,mid))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'repair-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))






