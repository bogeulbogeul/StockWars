"""Restore the original eye texels while preserving teary brows, tears and mouth."""
import bpy,numpy as np,json
from pathlib import Path
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v5'
bpy.ops.wm.open_mainfile(filepath=str(source/'somangi-expressions.blend'))
scene=bpy.context.scene;scene.frame_set(136);body=bpy.data.objects['Somangi_SmoothBody']
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'));entry=next(e for e in data['expressions'] if e['id']=='teary')
baseline=body.data.materials[0].node_tree.nodes['Image Texture'].image
image=bpy.data.materials[entry['materials'][0]].node_tree.nodes['Image Texture'].image
w,h=image.size;base=np.array(baseline.pixels[:],np.float32).reshape(h,w,4);old=np.array(image.pixels[:],np.float32).reshape(h,w,4);result=old.copy()
uv=body.data.uv_layers.active;body.data.calc_loop_triangles();eye_mask=np.zeros((h,w),bool);native_ink=np.zeros((h,w),bool)
for tri in body.data.loop_triangles:
 xyz=np.array([body.data.vertices[i].co[:] for i in tri.vertices])
 if xyz[:,2].max()<.265 or xyz[:,2].min()>.435 or xyz[:,1].min()>-.33:continue
 coords=np.array([uv.data[i].uv[:] for i in tri.loops])*[w,h]-.5
 lo=np.maximum(np.floor(coords.min(0)).astype(int),0);hi=np.minimum(np.ceil(coords.max(0)).astype(int),[w-1,h-1])
 if np.any(hi<lo):continue
 xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1));matrix=np.stack([coords[1]-coords[0],coords[2]-coords[0]],axis=1)
 if abs(np.linalg.det(matrix))<1e-8:continue
 bc=np.stack([xx-coords[0,0],yy-coords[0,1]],axis=-1)@np.linalg.inv(matrix).T;a,c=bc[:,:,0],bc[:,:,1]
 world=xyz[0]+a[:,:,None]*(xyz[1]-xyz[0])+c[:,:,None]*(xyz[2]-xyz[0])
 mask=(a>=-.02)&(c>=-.02)&(a+c<=1.02)&(abs(world[:,:,0])>.12)&(abs(world[:,:,0])<.37)&(world[:,:,2]>.265)&(world[:,:,2]<.435)&(world[:,:,1]<-.33)
 iy=yy[mask];ix=xx[mask]
 if len(ix)==0:continue
 b=base[iy,ix,:3];previous=old[iy,ix,:3];z=world[mask,2]
 tears=(previous[:,2]-previous[:,0]>.025)&(previous[:,1]-previous[:,0]>.025)
 brows=(z>.416)&(previous.min(axis=1)<.94)&(b.min(axis=1)>.94)
 preserve=(tears|brows)&(b.min(axis=1)>.94)
 colour=b.copy();colour[preserve]=previous[preserve];result[iy,ix,:3]=colour
 eye_mask[iy,ix]=True;native_ink[iy,ix]|=b.min(axis=1)<.94
assert np.array_equal(result[native_ink],base[native_ink])
border=eye_mask.copy()
for _ in range(5):
 accum=np.zeros_like(result);counts=np.zeros((h,w),np.float32)
 for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
  near=np.roll(border,(dy,dx),(0,1));accum+=np.roll(result,(dy,dx),(0,1))*near[:,:,None];counts+=near
 fill=(~border)&(counts>0);result[fill]=accum[fill]/counts[fill,None];border|=fill
assert np.array_equal(result[~border],old[~border])
image.pixels.foreach_set(result.ravel());image.filepath_raw=str(P/'textures/teary.png');image.file_format='PNG';image.save();image.pack()
original=[body.data.materials[i] for i in [0,1]]
for i,name in enumerate(entry['materials']):body.data.materials[i]=bpy.data.materials[name]
scene.render.filepath=str(P/'portraits/teary.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig=bpy.data.objects['Somangi_WholeArmRig'];rig.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(P/'models/teary.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False)
for i,mat in enumerate(original):body.data.materials[i]=mat
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-expressions.blend'))
(P/'eye-size-verification.json').write_text(json.dumps(dict(reference='smile',adjustedExpression='teary',nativeEyeTexelsRestored=int(native_ink.sum()),nativeEyePixelsExactlyMatch=True,pixelsOutsideEyeRegionUnchanged=True,otherExpressionsChanged=False),indent=2))
