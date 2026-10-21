import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v6/Anna-meshy-short-vest.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];o=bpy.data.objects['Anna_Vest'];inv=o.matrix_world.inverted();co=np.array([tuple(o.matrix_world@v.co) for v in o.data.vertices]);grid=np.linspace(-.53,.10,127);deltas=[]
for sign in [-1,1]:
 profile=[]
 for z in grid:
  sel=co[(abs(co[:,2]-z)<.008)&(co[:,1]*sign>.10)]
  profile.append(np.max(sel[:,1]*sign) if len(sel) else np.nan)
 profile=np.array(profile);valid=np.isfinite(profile);profile=np.interp(grid,grid[valid],profile[valid]);k=np.arange(-27,28);kernel=np.exp(-.5*(k/9)**2);kernel/=kernel.sum();smoothed=np.convolve(np.pad(profile,(27,27),mode='edge'),kernel,mode='valid');deltas.append(smoothed-profile)
maximum=0
for v,q0 in zip(o.data.vertices,co):
 q=Vector(q0);t=max(0,min(1,(q.z+.43)/.07))*max(0,min(1,(.055-q.z)/.07));t=t*t*(3-2*t)
 sign=-1 if q.y<0 else 1;delta=float(np.interp(q.z,grid,deltas[0 if sign<0 else 1]));side=max(0,min(1,(abs(q.y)-.10)/.10));dy=sign*delta*t*side;q.y+=dy;maximum=max(maximum,abs(dy));v.co=inv@q
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(7);cam=s.camera;target=Vector((0,0,.1));cam.data.ortho_scale=2.6;s.render.resolution_x=700;s.render.resolution_y=700
for name,pos in [('side',(5,0,.3)),('front',(0,-5,.3))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-meshy-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-meshy-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-meshy-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
(P/'validation.json').write_text(json.dumps({'localized_front_back_profile_smoothing':True,'maximum_y_adjustment':maximum,'x_z_materials_unchanged':True},indent=2));print(maximum)
