import bpy,numpy as np,math,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body']
rig.animation_data_clear()
for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
bs=mesh.data.materials[0].node_tree.nodes.get('Principled BSDF');texnode=bs.inputs['Base Color'].links[0].from_node;original=texnode.image
w,h=original.size;pixels=np.array(original.pixels[:],dtype=np.float32).reshape(h,w,4);result=pixels.copy();written=np.zeros((h,w),dtype=bool);white=np.median(pixels[:,:,:3][pixels[:,:,:3].min(axis=2)>.9],axis=0)
# Analytic rounded strokes in model coordinates, baked through the existing UV map.
uv=mesh.data.uv_layers.active;mesh.data.calc_loop_triangles();changed=0
for tri in mesh.data.loop_triangles:
 xyz=np.array([mesh.data.vertices[i].co[:] for i in tri.vertices])
 if xyz[:,2].max()<.18 or xyz[:,2].min()>.5 or xyz[:,1].min()>-.32 or xyz[:,0].min()>.36 or xyz[:,0].max()<-.36:continue
 coords=np.array([uv.data[i].uv[:] for i in tri.loops])*[w,h]-.5
 xmin=max(0,int(np.floor(coords[:,0].min())));xmax=min(w-1,int(np.ceil(coords[:,0].max())));ymin=max(0,int(np.floor(coords[:,1].min())));ymax=min(h-1,int(np.ceil(coords[:,1].max())))
 if xmax<xmin or ymax<ymin:continue
 xx,yy=np.meshgrid(np.arange(xmin,xmax+1),np.arange(ymin,ymax+1));q=np.stack([xx-coords[0,0],yy-coords[0,1]],axis=-1)
 mat=np.stack([coords[1]-coords[0],coords[2]-coords[0]],axis=1)
 if abs(np.linalg.det(mat))<1e-8:continue
 bc=q@np.linalg.inv(mat).T;a,b=bc[:,:,0],bc[:,:,1];inside=(a>=-.02)&(b>=-.02)&(a+b<=1.02)
 world=xyz[0]+a[:,:,None]*(xyz[1]-xyz[0])+b[:,:,None]*(xyz[2]-xyz[0])
 mask=inside&(abs(world[:,:,0])<.13)&(world[:,:,2]>.195)&(world[:,:,2]<.335)&(world[:,:,1]<-.33)
 if not mask.any():continue
 points=world[mask][:,[0,2]]
 radius=np.sqrt(((points[:,0]+.008)/.034)**2+((points[:,1]-.278)/.037)**2)
 ink=np.zeros(len(points))
 fade=np.minimum.reduce([(.13-abs(points[:,0]))/.025,(points[:,1]-.195)/.025,(.335-points[:,1])/.016]);fade=np.clip(fade,0,1)
 patch=result[ymin:ymax+1,xmin:xmax+1,:3];old=patch[mask];clean=white[None,:]*(1-ink[:,None])+np.array([.008,.008,.008])[None,:]*ink[:,None]
 patch[mask]=old*(1-fade[:,None])+clean*fade[:,None];written[ymin:ymax+1,xmin:xmax+1]|=mask;changed+=int(mask.sum())
# Add gutters around the painted UV islands to avoid old eye texels bleeding through seams.
for _ in range(5):
 accum=np.zeros_like(result);counts=np.zeros((h,w),dtype=np.float32)
 for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
  neighbor=np.roll(written,(dy,dx),(0,1));accum+=np.roll(result,(dy,dx),(0,1))*neighbor[:,:,None];counts+=neighbor
 fill=(~written)&(counts>0);result[fill]=accum[fill]/counts[fill,None];written|=fill
image=bpy.data.images.new('Somangi_Eating_BaseColor',width=w,height=h,alpha=True);image.colorspace_settings.name=original.colorspace_settings.name;image.pixels.foreach_set(result.ravel());image.filepath_raw=str(P/'mouth-clean-basecolor.png');image.file_format='PNG';image.save();image.pack();texnode.image=image
from mathutils.bvhtree import BVHTree
bvh=BVHTree.FromPolygons([v.co for v in mesh.data.vertices],[list(p.vertices) for p in mesh.data.polygons])
def mouth_point(r,angle,opened):
 x=-.008+r*(.032+.035*opened)*math.cos(angle);z=.275+r*(.008+.072*opened)*math.sin(angle)
 loc,normal,index,distance=bvh.ray_cast(Vector((x,-2,z)),Vector((0,1,0)))
 assert loc is not None
 return (x,loc.y-.004,z)
segments=64;rings=6;spec=[(0,0)]+[(j/rings,k*2*math.pi/segments) for j in range(1,rings+1) for k in range(segments)]
vertices=[mouth_point(r,a,0) for r,a in spec];faces=[]
for k in range(segments):faces.append((0,1+(k+1)%segments,1+k))
for j in range(rings-1):
 for k in range(segments):
  a=1+j*segments+k;b=1+j*segments+(k+1)%segments;c=1+(j+1)*segments+(k+1)%segments;d=1+(j+1)*segments+k
  faces.append((a,b,c,d))
data=bpy.data.meshes.new('Surface mouth');data.from_pydata(vertices,[],faces);data.update()
mouth=bpy.data.objects.new('Mouth_Animated',data);bpy.context.collection.objects.link(mouth);mouth.parent=rig
mat=bpy.data.materials.new('Matte black mouth');mat.use_nodes=True;shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.003,.003,.003,1);shader.inputs['Roughness'].default_value=1;shader.inputs['Specular IOR Level'].default_value=0;data.materials.append(mat)
for p in data.polygons:p.use_smooth=True
vg=mouth.vertex_groups.new(name='Head');vg.add(list(range(len(vertices))),1,'REPLACE');mod=mouth.modifiers.new('Follow Head','ARMATURE');mod.object=rig
mouth.shape_key_add(name='Basis');opened=mouth.shape_key_add(name='Mouth_Open')
for i,(r,a) in enumerate(spec):opened.data[i].co=mouth_point(r,a,1)
for frame in range(1,74):
 opened.value=.5-.5*math.cos(8*math.pi*(frame-1)/72);opened.keyframe_insert('value',frame=frame)
mouth.data.shape_keys.animation_data.action.name='Mouth_Chew'
s.frame_start=1;s.frame_end=73;s.render.fps=24;s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16
cam=s.camera;cam.location=(0,-6,0);target=Vector((0,0,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.5
for name,frame in [('closed',1),('open',10)]:
 s.frame_set(frame);s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True);mouth.select_set(True);bpy.context.view_layer.objects.active=rig
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-chew.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-chew.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=10
folder=P/'front-frames';folder.mkdir(exist_ok=True)
for frame in range(1,73,2):
 s.frame_set(frame);s.render.filepath=str(folder/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
print('CHEW_COMPLETE')
