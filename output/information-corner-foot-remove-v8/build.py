"""Remove protruding exterior corner feet, retaining the porch bases."""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'information-molding-occluded-v7/Information-horizontal-molding.blend'))
s=bpy.context.scene
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and not o.name.startswith(('Corner_Grounded_Foot','Corner_Oak_Post'))}
removed=[]
for o in list(s.objects):
 if o.name.startswith('Corner_Grounded_Foot'):
  removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
assert len(removed)==4
for o in s.objects:
 if o.type=='MESH' and o.name.startswith('Corner_Oak_Post'):
  for v in o.data.vertices:
   p=o.matrix_world@v.co
   if p.z<.19:
    p.z-=.016*min(1,max(0,(.19-p.z)/.015));v.co=o.matrix_world.inverted()@p
  o.data.update()
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Information-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=24;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.1,1.1),4.5),('corner-detail',(4,-6,2.2),(1.40,-.82,.21),.85),('rear',(4,6,3.5),(0,0,1.1),4.5)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Information-flush-corners.blend'))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Information-clean.glb'))
assert not any(o.name.startswith('Corner_Grounded_Foot') for o in bpy.context.scene.objects)
assert sum(o.name.startswith('Porch_Grounded_Base') for o in bpy.context.scene.objects)==2
assert all(math.isfinite(c) for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices for c in v.co)
(R/'validation.json').write_text(json.dumps({'removedFeet':removed,'unchangedMeshes':len(before),'glbReload':True,'porchBasesPreserved':2,'gameApplied':False,'sha256':hashlib.sha256((R/'Information-clean.glb').read_bytes()).hexdigest()},indent=2))
