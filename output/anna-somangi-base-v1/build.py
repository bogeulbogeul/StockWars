import bpy,math,json,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-walk-v4/somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];base=[bpy.data.objects[n] for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']]
original={o.name:[tuple(v.co) for v in o.data.vertices] for o in base}
# Append the approved Anna accessories only.
with bpy.data.libraries.load(str(P.parent/'anna-vest-fit-v3/Anna-vest-fit.blend'),link=False) as (src,dst):dst.objects=['Anna_PlumpLeaf','Anna_Vest']
accessories=[]
for o in dst.objects:
 bpy.context.collection.objects.link(o);accessories.append(o)
leaf,vest=accessories
for v in leaf.data.vertices:v.co.z+=.257026
for v in vest.data.vertices:
 q=vest.matrix_world@v.co;q.x*=1.30;q.y*=1.30;q.z=(q.z+.1)*1.30-.01;v.co=vest.matrix_world.inverted()@q
# Match the broader Somangi torso without changing any base vertices.
rig.data.pose_position='REST';bpy.context.view_layer.update();tree=BVHTree.FromObject(bpy.data.objects['Eating_Torso'],bpy.context.evaluated_depsgraph_get())
for v in vest.data.vertices:
 q=vest.matrix_world@v.co;c=Vector((0,-.01,q.z));d=q-c;r=d.length
 if r<1e-6:continue
 direction=d/r;hit,normal,index,dist=tree.ray_cast(c,direction,2)
 if hit is None:continue
 t=max(0,min(1,(-q.z+.01)/.18));t=t*t*(3-2*t);gap=r-dist
 move=(gap*.7-.03)*t;q-=direction*move;v.co=vest.matrix_world.inverted()@q
for o,n in [(leaf,'Head'),(vest,'Body')]:
 world=o.matrix_world.copy();o.parent=rig;o.matrix_world=world;o.vertex_groups.clear();g=o.vertex_groups.new(name=n);g.add(list(range(len(o.data.vertices))),1,'REPLACE');m=o.modifiers.new('Follow shared skeleton','ARMATURE');m.object=rig
# Recolor the shared body materials, retaining its original face UV and expression.
cream=(1,.77,.49,1)
for o in base:
 for mat in o.data.materials:
  if mat is None:continue
  bs=mat.node_tree.nodes.get('Principled BSDF')
  if o.name!='Somangi_Body':bs.inputs['Base Color'].default_value=cream
head=base[0];mat=head.data.materials[0].copy();mat.name='Anna_SharedBase_Face';head.data.materials[0]=mat
tex=next(n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image);im=tex.image.copy();im.name='Anna_SharedBase_CreamFace';pixels=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4);pixels[:,:3]*=np.array([1,.89,.733],dtype=np.float32);im.pixels.foreach_set(pixels.ravel());im.pack();tex.image=im
rig.data.pose_position='POSE';s.frame_set(7);s.render.resolution_x=700;s.render.resolution_y=700;s.cycles.samples=16
cam=s.camera;target=Vector((0,0,.12));cam.data.ortho_scale=2.6
for name,pos in [('front',(0,-5,.25)),('side',(5,0,.25)),('back',(0,5,.25))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
assert all(original[o.name]==[tuple(v.co) for v in o.data.vertices] for o in base)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-shared-base.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in base+accessories:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-shared-base.glb'),export_format='GLB',use_selection=True,export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'somangi_base_vertices_unchanged':True,'source':'somangi-walk-v4','accessories':['Anna_PlumpLeaf','Anna_Vest'],'body_face':'Somangi original face recolored cream','actions':[a.name for a in bpy.data.actions]},indent=2))
s.render.resolution_x=420;s.render.resolution_y=420
for view,pos in [('front',(0,-5,.25)),('side',(5,0,.25))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 for f in range(1,25,2):
  s.frame_set(f);s.render.filepath=str(P/(view+'-%02d.png'%f));bpy.ops.render.render(write_still=True)
