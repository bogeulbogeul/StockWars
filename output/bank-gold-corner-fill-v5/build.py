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
 poly=[(side*(edge-.010),-1.060),(side*.736,-1.060),(side*.736,roof.seam(.736)-.006)]
 backing=roof.solid('Gold_Corner_Closed_Roof_Backing',poly,lambda x,y:2.22+roof.MS*y,gold,.065,0,.002)
 tile=roof.solid('Gold_Fitted_Corner_Tile',poly,lambda x,y:2.22+roof.MS*y,gold,.056,.039,.008)
 bpy.context.view_layer.objects.active=tile;m=tile.modifiers.new('Single_Closed_Corner_Tile','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=backing
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(backing,do_unlink=True)
 cut=box('Hidden_Underside_Trim',(.5,.7,.5),(side*.70,-1.16,1.14),gold,0)
 bpy.context.view_layer.objects.active=tile;m=tile.modifiers.new('Flush_Wood_Seat','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bank-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.12),4.6),('gold-corner-detail',(3,-5,3),(.66,-1.06,1.43),.85)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bank-filled-gold-corner.blend'))
(R/'validation.json').write_text(json.dumps({'source':'bank-eaves-joint-v3','creamWallFillRemoved':True,'newFittedGoldTiles':2,'unchangedMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'Bank-clean.glb').read_bytes()).hexdigest()},indent=2))
