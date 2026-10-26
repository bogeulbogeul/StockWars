"""Trim the exposed porch overhang and join intersecting timber fascia."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'bank-redesign-v2/Bank-redesign.blend'))
s=bpy.context.scene
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
prefixes=('Porch_Continuous_Timber_Frame','Front_Horizontal_Timber','Porch_Cream_Pediment','Gold_Pitched_Roof_Porch')
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and not o.name.startswith(prefixes)}
frame=bpy.data.objects['Porch_Continuous_Timber_Frame'];wood=bpy.data.materials['Bank_Honey_Wood']
pediment=bpy.data.objects['Porch_Cream_Pediment']
for v in pediment.data.vertices:v.co.x*=.97
pediment.data.update()
for o in s.objects:
 if o.name.startswith('Gold_Pitched_Roof_Porch'):o.scale.x*=.985
for o in s.objects:
 if o.name.startswith('Front_Horizontal_Timber'):o.location.y+=.048
# Recess the side faces under the outer tile edge, keeping the front gable intact.
for side in (-1,1):
 cut=box('Overhanging_Timber_Trim',(.20,.7,.8),(side*.828,-1.12,1.45),wood,0)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Flush_Tile_Edge','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
# The original horizontal fascia overlaps the porch by 13 mm; union it instead
# of leaving its rounded end cap visible against the side of the porch timber.
others=[o for o in s.objects if o.name.startswith('Front_Horizontal_Timber')]
for o in others:
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Continuous_Eaves_Solid','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=o
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
frame.name='Bank_Continuous_Joined_Eaves'
bm=bmesh.new();bm.from_mesh(frame.data)
assert all(e.is_manifold for e in bm.edges)
bm.free()
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bank-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.12),4.6),('eaves-detail',(3,-5,3),(.66,-1.06,1.43),.85),('front',(0,-7,2.8),(0,-.1,1.12),4.6)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bank-eaves-joint.blend'))
(R/'validation.json').write_text(json.dumps({'joinedTimberClosed':True,'unchangedMeshes':len(before),'porchTimberHalfWidth':.728,'tileHalfWidth':.73,'gameApplied':False,'sha256':hashlib.sha256((R/'Bank-clean.glb').read_bytes()).hexdigest()},indent=2))
