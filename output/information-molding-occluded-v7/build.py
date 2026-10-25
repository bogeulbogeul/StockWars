"""Terminate the front wall molding outside the porch roof envelope."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'information-contact-v4/Information-sealed-contact.blend'))
s=bpy.context.scene
def signature(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:signature(o) for o in s.objects if o.type=='MESH' and o.name!='Wood_Fascia'}
wood=bpy.data.materials['Office_Honey_Wood'];molding=bpy.data.objects['Wood_Fascia']
molding.location.z-=.10
bpy.context.view_layer.update()
# Follow the real .57/.72 porch pitch, allowing 12 mm outside the tile surface.
slope=.57/.72;peak=1.96+.038
cut=extrude('Porch_Roof_Molding_Clearance',[(-.728,1.20),(.728,1.20),(.728,1.75),(-.728,1.75)],-1.40,-.875,wood,0)
bpy.context.view_layer.objects.active=molding
mod=molding.modifiers.new('Miter_To_Porch_Roof','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
bpy.ops.object.modifier_apply(modifier=mod.name)
# Verify that the delivered molding has no volume left inside the cutter.
probe=molding.copy();probe.data=molding.data.copy();bpy.context.collection.objects.link(probe)
bpy.context.view_layer.objects.active=probe
mod=probe.modifiers.new('Clearance_Proof','BOOLEAN');mod.operation='INTERSECT';mod.object=cut
bpy.ops.object.modifier_apply(modifier=mod.name)
bm=bmesh.new();bm.from_mesh(probe.data);intersection=abs(bm.calc_volume());bm.free()
assert intersection<1e-8,('Molding remains in roof envelope',intersection)
bpy.data.objects.remove(probe,do_unlink=True);bpy.data.objects.remove(cut,do_unlink=True)
bm=bmesh.new();bm.from_mesh(molding.data)
assert all(e.is_manifold for e in bm.edges);bm.free()
assert all(signature(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Information-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=24;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.1,1.1),4.5),('molding-detail',(3,-5,2.8),(.64,-.94,1.49),.82),('porch-detail',(2,-5,2.6),(0,-1.12,1.58),1.75)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Information-horizontal-molding.blend'))
(R/'validation.json').write_text(json.dumps({'moldingRoofIntersectionVolume':intersection,'moldingClosed':True,'unchangedMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'Information-clean.glb').read_bytes()).hexdigest()},indent=2))
