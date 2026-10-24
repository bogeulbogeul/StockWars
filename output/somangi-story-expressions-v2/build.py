"""Bake expression variants through the unchanged model's native UVs."""
import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from face_styles import STYLES,paint
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rear-junction-v43/somangi-eat.blend'))
scene=bpy.context.scene;scene.frame_set(136);body=bpy.data.objects['Somangi_SmoothBody']
sourcecoords=np.array([v.co[:] for v in body.data.vertices]);sourceweights=[[(g.group,g.weight) for g in v.groups] for v in body.data.vertices]
skin=body.data.materials[0];inkmat=body.data.materials[1]
original=skin.node_tree.nodes['Image Texture'].image;w,h=original.size
pixels=np.array(original.pixels[:],dtype=np.float32).reshape(h,w,4)
white=np.median(pixels[:,:,:3][pixels[:,:,:3].min(axis=2)>.94],axis=0)
uv=body.data.uv_layers.active;body.data.calc_loop_triangles();records=[];written=np.zeros((h,w),bool)
for tri in body.data.loop_triangles:
 xyz=np.array([body.data.vertices[i].co[:] for i in tri.vertices])
 if xyz[:,2].max()<.17 or xyz[:,2].min()>.52 or xyz[:,1].min()>-.32 or xyz[:,0].min()>.37 or xyz[:,0].max()<-.37:continue
 coords=np.array([uv.data[i].uv[:] for i in tri.loops])*[w,h]-.5
 lo=np.maximum(np.floor(coords.min(0)).astype(int),0);hi=np.minimum(np.ceil(coords.max(0)).astype(int),[w-1,h-1])
 if np.any(hi<lo):continue
 xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1))
 mat=np.stack([coords[1]-coords[0],coords[2]-coords[0]],axis=1)
 if abs(np.linalg.det(mat))<1e-8:continue
 bc=np.stack([xx-coords[0,0],yy-coords[0,1]],axis=-1)@np.linalg.inv(mat).T;a,c=bc[:,:,0],bc[:,:,1]
 world=xyz[0]+a[:,:,None]*(xyz[1]-xyz[0])+c[:,:,None]*(xyz[2]-xyz[0])
 mask=(a>=-.02)&(c>=-.02)&(a+c<=1.02)&(abs(world[:,:,0])<.37)&(world[:,:,2]>.17)&(world[:,:,2]<.52)&(world[:,:,1]<-.33)
 if not mask.any():continue
 ix=xx[mask];iy=yy[mask];points=world[mask][:,[0,2]];records.append((iy,ix,points));written[iy,ix]=True
print('FACE MAP',int(written.sum()),len(records),flush=True)
(P/'textures').mkdir(exist_ok=True);(P/'portraits').mkdir(exist_ok=True)
library=[];manifest=[]
for key,label,use in STYLES:
 result=pixels.copy()
 if key!='smile':
  for iy,ix,points in records:
   ink,blush,tear,keep_eyes,keep_mouth=paint(points,key)
   colour=np.tile(white,(len(points),1))
   colour=colour*(1-blush[:,None])+np.array([1.,.57,.57])*blush[:,None]
   colour=colour*(1-tear[:,None])+np.array([.48,.73,.82])*tear[:,None]
   colour=colour*(1-ink[:,None])+.004*ink[:,None]
   keep=np.zeros(len(points),bool)
   if keep_eyes:keep|=(abs(points[:,0])>.12)&(points[:,1]>.265)&(points[:,1]<.435)
   if keep_mouth:keep|=(abs(points[:,0])<.13)&(points[:,1]<.33)
   colour[keep]=pixels[iy[keep],ix[keep],:3]
   fade=np.minimum.reduce([(.37-abs(points[:,0]))/.025,(points[:,1]-.17)/.02,(.52-points[:,1])/.02]);fade=np.clip(fade,0,1)
   result[iy,ix,:3]=pixels[iy,ix,:3]*(1-fade[:,None])+colour*fade[:,None]
  # UV gutters prevent the previous facial ink bleeding through island borders.
  border=written.copy()
  for _ in range(5):
   accum=np.zeros_like(result);counts=np.zeros((h,w),np.float32)
   for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
    near=np.roll(border,(dy,dx),(0,1));accum+=np.roll(result,(dy,dx),(0,1))*near[:,:,None];counts+=near
   fill=(~border)&(counts>0);result[fill]=accum[fill]/counts[fill,None];border|=fill
 image=bpy.data.images.new('Expression_'+key,width=w,height=h,alpha=True);image.colorspace_settings.name=original.colorspace_settings.name
 image.pixels.foreach_set(result.ravel());image.filepath_raw=str(P/'textures'/f'{key}.png');image.file_format='PNG';image.save();image.pack()
 pair=[]
 for source in [skin,inkmat]:
  material=source.copy();material.name='Expression_'+key+('_skin' if source==skin else '_ink');material.use_fake_user=True
  material.node_tree.nodes['Image Texture'].image=image
  # Keep new facial ink nonmetallic and free of bright specular highlights.
  nodes=material.node_tree.nodes;links=material.node_tree.links;shader=nodes['Principled BSDF'];shader.inputs['Metallic'].default_value=0
  bw=nodes.new('ShaderNodeRGBToBW');links.new(nodes['Image Texture'].outputs['Color'],bw.inputs[0])
  test=nodes.new('ShaderNodeMath');test.operation='LESS_THAN';test.inputs[1].default_value=.15;links.new(bw.outputs[0],test.inputs[0])
  spec=nodes.new('ShaderNodeMath');spec.operation='MULTIPLY_ADD';spec.inputs[1].default_value=-.5;spec.inputs[2].default_value=.5
  links.new(test.outputs[0],spec.inputs[0]);links.new(spec.outputs[0],shader.inputs['Specular IOR Level'])
  pair.append(material)
 library.append(pair);manifest.append(dict(id=key,label=label,storyUse=use,texture='textures/'+key+'.png',materials=[m.name for m in pair],originalSmileMouthPreserved=key in ['smile','happy','shy','proud','relieved','touched']))
 print('TEXTURE',key,flush=True)
for ob in scene.objects:
 if ob.name!='Somangi_SmoothBody' and ob.type=='MESH':ob.hide_render=True
world=bpy.data.worlds.new('Expression studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.24,.24,.24,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
target=Vector((0,-.05,.45))
for pos,energy in [((-3,-4,5),450),((4,2,4),300),((-4,-3,0),160),((4,-3,0),160)]:
 bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=energy;light.data.size=4;light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,.45));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.25;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
for entry,pair in zip(manifest,library):
 body.data.materials[0]=pair[0];body.data.materials[1]=pair[1]
 scene.render.filepath=str(P/'portraits'/f"{entry['id']}.png");bpy.ops.render.render(write_still=True)
body.data.materials[0]=library[0][0];body.data.materials[1]=library[0][1]
assert np.array_equal(sourcecoords,np.array([v.co[:] for v in body.data.vertices]))
assert sourceweights==[[(g.group,g.weight) for g in v.groups] for v in body.data.vertices]
(P/'manifest.json').write_text(json.dumps(dict(source='somangi-rear-junction-v43',headBodyGeometryChanged=False,rigAndMotionChanged=False,expressionSwitchImplemented=False,expressions=manifest),ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-expressions.blend'))
print('EXPRESSIONS COMPLETE',flush=True)
