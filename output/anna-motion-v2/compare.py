import bpy,json,math
from pathlib import Path
from mathutils import Quaternion
P=Path(__file__).resolve().parent

def read(path,name,anna=False):
 bpy.ops.wm.open_mainfile(filepath=str(path));rig=bpy.data.objects[name];rows=[]
 for f in range(1,26):
  bpy.context.scene.frame_set(f);row={}
  for n in ['Leg.L','Leg.R','Arm.L','Arm.R']:
   pb=rig.pose.bones[n];b=pb.bone.matrix_local.to_quaternion();q=b@pb.rotation_quaternion@b.inverted()
   if anna and n.startswith('Arm'):
    sign=1 if n.endswith('L') else -1;q=q@Quaternion((0,1,0),math.radians(-sign*60))
   row[n]=tuple(q)
  rows.append(row)
 return rows
ref=read(P.parent/'somangi-walk-v4/somangi-walk.blend','Somangi_Rig')
out=read(P/'Anna-motion.blend','Anna_Rig',True)
error=max(min(max(abs(a-b) for a,b in zip(ref[f][n],out[f][n])),max(abs(a+b) for a,b in zip(ref[f][n],out[f][n]))) for f in range(25) for n in ref[f])
assert error<1e-5,error
r=json.loads((P/'validation.json').read_text());r['somangi_limb_rotation_quaternion_max_error']=error;r['cycle_seconds']=.75;(P/'validation.json').write_text(json.dumps(r,indent=2));print('SOMANGI_MATCH',error)
