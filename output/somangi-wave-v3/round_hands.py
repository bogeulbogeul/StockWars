import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
mode=sys.argv[sys.argv.index('--')+1]
source,version,stem,frame=('somangi-wave-v2','somangi-wave-v3','wave',25) if mode=='wave' else ('somangi-eat-v4','somangi-eat-v5','eat',34)
P=ROOT/version
bpy.ops.wm.open_mainfile(filepath=str(ROOT/source/f'somangi-{stem}.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];report={}
for side,sign in [('L',1),('R',-1)]:
 obj=bpy.data.objects['Rigid_Arm.'+side];bone=rig.data.bones['Arm.'+side];direction=(Vector((sign*.566,-.015,-.387))-bone.head_local).normalized();maximum=0;axial_error=0
 for v in obj.data.vertices:
  original=v.co.copy();delta=v.co-bone.head_local;along=delta.dot(direction);radial=delta-direction*along;r=radial.length
  if along<=.26 or r<1e-7:continue
  u=max(0,min(1,(along-.26)/.10));blend=u*u*(3-2*u)
  radius=.122;cap_center=.530-radius;target=math.sqrt(max(0,radius*radius-max(0,along-cap_center)**2))
  v.co=bone.head_local+direction*along+radial*((r*(1-blend)+target*blend)/r)
  maximum=max(maximum,(v.co-original).length);axial_error=max(axial_error,abs((v.co-original).dot(direction)))
 obj.data.update();report[side]={'maximum_radial_adjustment':maximum,'axial_position_error':axial_error,'cap_radius':.122}
(P/'hand-repair.json').write_text(json.dumps(report,indent=2));print('ROUND_HANDS',json.dumps(report))
s.frame_set(frame);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.1,0))
for name,pos in [(stem+'-front',(0,-6,0)),(stem+'-side',(6,-.1,0)),(stem+'-angle',(2.5,-6,.7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7 if mode=='wave' else 2.6;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
names=['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']+(['Food_Bun','Mouth_Animated'] if mode=='eat' else [])
for name in names:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/f'somangi-{stem}.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/f'somangi-{stem}.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE' if mode=='eat' else 'ACTIONS',export_cameras=False,export_lights=False)
if mode=='eat':
 sys.path.insert(0,str(ROOT/'somangi-eat-v4'));from merge_clips import merge_clips
 merge_clips(P/'somangi-eat.glb')
