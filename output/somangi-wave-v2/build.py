import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-wave-v1/somangi-wave.blend'))
s=bpy.context.scene;torso=bpy.data.objects['Eating_Torso'];data=torso.data
original=np.array([v.co[:] for v in data.vertices]);rings=original.reshape(97,64,3);z=rings[:,0,2];rx=np.max(abs(rings[:,:,0]),axis=1);ry=np.max(abs(rings[:,:,1]+.01),axis=1)
region=(z>-.64)&(z<-.1);cx=np.polyfit(z[region],rx[region]**2,2);cy=np.polyfit(z[region],ry[region]**2,2)
grid=np.linspace(-.64,-.1,501);mx=np.sqrt(np.maximum(0,np.polyval(cx,grid))).max();my=np.sqrt(np.maximum(0,np.polyval(cy,grid))).max()
def smooth(a,b,t):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
for j,value in enumerate(z):
 blend=smooth(-.65,-.55,value)*(1-smooth(-.19,-.08,value))
 if blend==0:continue
 nx=np.sqrt(max(0,np.polyval(cx,value)))*rx.max()/mx;ny=np.sqrt(max(0,np.polyval(cy,value)))*ry.max()/my
 for k in range(64):
  v=data.vertices[j*64+k];v.co.x*=1+blend*(nx/max(rx[j],1e-8)-1);v.co.y=-.01+(v.co.y+.01)*(1+blend*(ny/max(ry[j],1e-8)-1))
data.update();report={'method':'smooth elliptical belly cross sections with blended fixed boundaries','maximum_vertex_adjustment':float(np.linalg.norm(np.array([v.co[:] for v in data.vertices])-original,axis=1).max()),'animation_changed':False,'face_arms_feet_changed':False}
(P/'belly-repair.json').write_text(json.dumps(report,indent=2));print('BELLY_REPAIR',json.dumps(report))
s.frame_set(25);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.05,0))
for name,pos in [('wave-front',(0,-6,0)),('wave-side',(6,-.1,0)),('wave-angle',(2.5,-6,.7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Somangi_Rig']
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-wave.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-wave.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
