import bpy, numpy as np, json
from pathlib import Path
from mathutils import Vector

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'agent-k-crystal-v2/Agent-K.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];o=bpy.data.objects['Somangi_Body']
removed=[]
for q in list(bpy.data.objects):
    if q.name.startswith('Glasses temple'):
        removed.append(q.name);bpy.data.objects.remove(q,do_unlink=True)
bs=o.data.materials[0].node_tree.nodes.get('Principled BSDF')
tex=bs.inputs['Base Color'].links[0].from_node;original=tex.image
w,h=original.size;pixels=np.array(original.pixels[:],dtype=np.float32).reshape(h,w,4);result=pixels.copy()
skin=np.median(pixels[:,:,:3][pixels[:,:,:3].min(axis=2)>.5],axis=0)
uv=o.data.uv_layers.active;o.data.calc_loop_triangles();written=np.zeros((h,w),dtype=bool)
for tri in o.data.loop_triangles:
    xyz=np.array([o.data.vertices[i].co[:] for i in tri.vertices])
    if xyz[:,2].max()<.205 or xyz[:,2].min()>.33 or xyz[:,1].min()>-.33 or xyz[:,0].min()>.13 or xyz[:,0].max()<-.13:continue
    coords=np.array([uv.data[i].uv[:] for i in tri.loops])*[w,h]-.5
    lo=np.maximum(0,np.floor(coords.min(axis=0)).astype(int));hi=np.minimum([w-1,h-1],np.ceil(coords.max(axis=0)).astype(int))
    if (hi<lo).any():continue
    xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1))
    mat=np.stack([coords[1]-coords[0],coords[2]-coords[0]],axis=1)
    if abs(np.linalg.det(mat))<1e-8:continue
    bc=np.stack([xx-coords[0,0],yy-coords[0,1]],axis=-1)@np.linalg.inv(mat).T
    a,b=bc[:,:,0],bc[:,:,1];inside=(a>=-.02)&(b>=-.02)&(a+b<=1.02)
    world=xyz[0]+a[:,:,None]*(xyz[1]-xyz[0])+b[:,:,None]*(xyz[2]-xyz[0])
    mask=inside&(abs(world[:,:,0])<.13)&(world[:,:,2]>.205)&(world[:,:,2]<.33)&(world[:,:,1]<-.33)
    points=world[mask]
    dx=np.maximum(abs(points[:,0]+.008)-.032,0)
    dist=np.sqrt(dx*dx+(points[:,2]-.265)**2)
    ink=np.clip((.012-dist)/.002,0,1)
    patch=result[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
    patch[mask,:3]=skin[None,:]*(1-ink[:,None])+np.array([.10,.10,.11])*ink[:,None]
    written[lo[1]:hi[1]+1,lo[0]:hi[0]+1]|=mask
image=bpy.data.images.new('AgentK_short_straight_mouth',width=w,height=h,alpha=True)
image.colorspace_settings.name=original.colorspace_settings.name
image.pixels.foreach_set(result.ravel());image.filepath_raw=str(P/'face-basecolor.png');image.file_format='PNG';image.save();image.pack();tex.image=image
assert np.array_equal(result[~written],pixels[~written])
rig.animation_data.action=None;s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for q in rig.children_recursive:
    if q.type=='MESH':q.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Agent-K.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Agent-K.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
s.render.resolution_x=800;s.render.resolution_y=900;s.render.resolution_percentage=100;s.cycles.samples=24
cam=s.camera
for name,pos,target,scale in [('front',(0,-6,.32),(0,0,.25),2.9),('face-close',(1,-6,.5),(0,0,.41),1.45),('side',(6,0,.32),(0,0,.25),2.9)]:
    cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Agent-K.glb'))
assert not any(q.name.startswith('Glasses temple') for q in bpy.data.objects)
assert bpy.data.objects.get('Glasses bridge') and bpy.data.objects.get('AgentK_Crystal')
(P/'validation.json').write_text(json.dumps({'removed':removed,'texture_outside_mouth_unchanged':True,'mouth_texels':int(written.sum()),'glb_reimport_ok':True},indent=2))
