import bpy,json,hashlib,struct
from pathlib import Path
P=Path(__file__).resolve().parent
names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']
def snapshot(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));rig=bpy.data.objects['Somangi_Rig'];result={}
 for n in names:
  o=bpy.data.objects[n];result[n]=hashlib.sha256(b''.join(struct.pack('3f',*v.co) for v in o.data.vertices)).hexdigest()
 poses=[]
 for f in range(1,26):
  bpy.context.scene.frame_set(f);poses.append([tuple(v for row in b.matrix for v in row) for b in rig.pose.bones])
 return result,poses
old,poses=snapshot(P.parent/'somangi-walk-v4/somangi-walk.blend');new,newposes=snapshot(P/'Anna-shared-base.blend');assert old==new and poses==newposes
r=json.loads((P/'validation.json').read_text());r['shared_base_hashes_identical']=old==new;r['all_25_frames_all_bones_identical']=poses==newposes
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-shared-base.glb'));r['glb_mesh_count']=sum(o.type=='MESH' and o.name!='Icosphere' for o in bpy.data.objects);r['glb_bones']=len(next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones);r['glb_actions']=[a.name for a in bpy.data.actions];r['glb_mesh_names']=[o.name for o in bpy.data.objects if o.type=='MESH'];print('IMPORT_DETAILS',r);assert r['glb_mesh_count']==6 and r['glb_bones']==7
(P/'validation.json').write_text(json.dumps(r,indent=2));print(r)
