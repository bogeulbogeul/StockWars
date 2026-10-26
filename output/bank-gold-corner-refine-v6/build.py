"""Fill the missing triangular gold roof tile at each porch/eaves corner."""
import bpy,sys,json,hashlib,importlib.util
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
spec=importlib.util.spec_from_file_location('bank_roof_geometry',R.parent/'bank-redesign-v2/roof.py')
roof=importlib.util.module_from_spec(spec);spec.loader.exec_module(roof)
# Use v3 so the mistakenly added cream wall blocks are not carried forward.
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'bank-eaves-joint-v3/Bank-eaves-joint.blend'))
s=bpy.context.scene;gold=bpy.data.materials['Bank_Gold_Roof']
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH'}
edge=(1.98-roof.mh(-1.07))/roof.PS
for side in (-1,1):
 # Bridge the triangular region outside the main roof's front rectangle that
 # was left between the clipped porch tiles and the straight main eaves.
 poly=[(side*(edge+.004),-1.074),(side*.723,-1.074),(side*.723,roof.seam(.723)+.008)]
 for row,fn in enumerate([lambda x,y:y+1.168,lambda x,y:-1.172-y]):
  p=roof.clip(poly,fn)
  roof.solid('Gold_Thin_Seated_Corner_Tile',p,lambda x,y:2.22+roof.MS*y,gold,.035,.028,.004)
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bank-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.12),4.6),('gold-corner-detail',(3,-5,3),(.66,-1.06,1.43),.85)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bank-refined-gold-corner.blend'))
(R/'validation.json').write_text(json.dumps({'source':'bank-eaves-joint-v3','bulkyCornerRemoved':True,'thinFittedGoldTiles':4,'tileThickness':.035,'cornerOuterX':.723,'unchangedMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'Bank-clean.glb').read_bytes()).hexdigest()},indent=2))
