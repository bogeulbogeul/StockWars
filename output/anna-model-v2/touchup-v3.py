"""Correct only inner armholes and the unpainted sprout stem base."""
import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-model-v3';P.mkdir(exist_ok=True)
sys.path.insert(0,str(SRC));from glb_colors import clean_face_colors
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-rigged.blend'))
o=bpy.data.objects['Anna_Body'];m=o.data;rig=bpy.data.objects['Anna_Rig'];s=bpy.context.scene;s.frame_set(1)
V=np.array([v.co[:] for v in m.vertices]);norm=np.array([v.normal[:] for v in m.vertices]);x,y,z=V.T
attr=m.color_attributes['AnnaSurfaceColor'];before=np.array([c.color[:] for c in attr.data],dtype=np.float32);after=before.copy()
cream=np.array(m.materials['Anna_Cream'].diffuse_color[:3]);olive=np.array(m.materials['Anna_Vest'].diffuse_color[:3])
# Clear the inner opening, stopping short of the raised olive piping.
radius=np.sqrt(((y+.002)/.119)**2+((z+.213)/.119)**2)
arm_zone=(np.abs(x)>.235)&(np.abs(x)<.39)&(z<-.09)&(z>-.35)
clear=np.clip((.945-radius)/.050,0,1)*arm_zone
after[:,:3]=after[:,:3]*(1-clear[:,None])+cream[None,:]*clear[:,None]
# Stem sides reach below the old height cutoff. Keep the scalp's upward face cream.
stem_base=(z>.6775)&(z<.693)&(x>.012)&(x<.067)&(y>-.061)&(y<.049)&(norm[:,2]<.92)
stem_top=z>=.6828
stem=stem_base|stem_top
after[stem,:3]=olive
attr.data.foreach_set('color',after.ravel())
changed=np.max(abs(after-before),axis=1)>1e-7
assert np.all(~changed|arm_zone|stem)
assert np.array_equal(V,np.array([v.co[:] for v in m.vertices]))
report={'changed_vertices':int(changed.sum()),'armpit_changed_vertices':int((changed&arm_zone).sum()),'stem_changed_vertices':int((changed&stem).sum()),'geometry_unchanged':True,'weights_unchanged':True,'outside_target_colors_unchanged':bool(np.array_equal(before[~(arm_zone|stem)],after[~(arm_zone|stem)]))}
cam=s.camera;s.cycles.samples=32;s.render.resolution_x=900;s.render.resolution_y=900
views=[('armpit-right',(3,-2,.15),(.29,0,-.25),.55),('armpit-left',(-3,-2,.15),(-.29,0,-.25),.55),('sprout-close',(0,-4,1.8),(.06,0,.72),.42),('sprout-back',(0,4,1.8),(.04,0,.72),.42),('front',(0,-5,0),(0,0,0),2.28),('back',(0,5,0),(0,0,0),2.28)]
for name,delta,target,scale in views:
 if '--armpits-only' in sys.argv and name not in ['armpit-right','armpit-left','front']:continue
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-rigged.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-rigged.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False,export_all_vertex_colors=False)
clean_face_colors(P/'Anna-rigged.glb')
(P/'validation.json').write_text(json.dumps(report,indent=2));print('LOCAL_COLORS_FIXED',report)
