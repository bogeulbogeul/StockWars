import bpy,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path[:0]=[str(R),str(R.parent/'cipher-exterior-blender-v1'),str(R.parent/'cipher-reference-architecture-v20')]
from exterior_geometry import box,extrude
from projection import design,P
import roof
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'cipher-pediment-solid-v23/CipherSecurities-solid-pediment.blend'))
s=bpy.context.scene;d=design();blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream']
old=('Roof_Plane_','Roof_Tile_','Central_Ridge','Wing_Ridge','Wing_Hip','Central_Blue_Front_Edge','Rear_Windowless_Pediment','Wing_Closed_Outer_Eave')
for o in list(s.objects):
 if o.name.startswith(old):bpy.data.objects.remove(o,do_unlink=True)
# Remove only the obsolete skewed rear cornices fused into the front pediment.
body=bpy.data.objects['Pediment_Unified_Closed_Solid']
cut=box('Obsolete_Returns_Trim',(5,5,4),(0,float(d['front'])+.19+2.5,2),cream,0)
bpy.context.view_layer.objects.active=body;m=body.modifiers.new('Remove_Skewed_Roof_Returns','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
counts=roof.build(d,float(P[7]),float(P[8]))
for o in [o for o in s.objects if o.name.startswith(('Clean_Central_Cream_Return','Clean_Central_Side_Infill','Clean_Portico_Side_Bulkhead'))]:
 bpy.context.view_layer.objects.active=body;m=body.modifiers.new('Closed_Continuous_Portico_Return','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=o
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
# The old skewed rear wall must fit below the straight roof as well.
rear=bpy.data.objects['Rear_Closed_Central_Wall'];wallmat=rear.data.materials[0];bpy.data.objects.remove(rear,do_unlink=True)
L=float(d['left'][0]);Rr=float(d['right'][0]);cx=float(d['peak'][0]);pz=float(d['peak'][2])
extrude('Clean_Rear_Closed_Central_Wall',[(L+.035,0),(Rr-.035,0),(Rr-.035,float(d['right'][2])-.045),(cx,pz-.065),(L+.035,float(d['left'][2])-.045)],1.353,1.594,wallmat,.003)
frontwall=bpy.data.objects['Grand_Central_Front_Wall']
cut=box('Exposed_Front_Wall_Trim',(4,1,3),(L+.015-2,-1.48,1.5),cream,0)
bpy.context.view_layer.objects.active=frontwall;m=frontwall.modifiers.new('Fit_Beneath_Central_Roof','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
shell=bpy.data.objects['Grand_Central_Shell']
cut=box('Upper_Shell_Roof_Boundary_Trim',(4,5,2),(L+.015-2,0,2.55),cream,0)
bpy.context.view_layer.objects.active=shell;m=shell.modifiers.new('Keep_Upper_Shell_Inside_Roof','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
assert all(bpy.data.objects.get(n) for n in ['Clock_Hour','Clock_Minute','Door_Assembly'])
bpy.ops.object.select_all(action='DESELECT')
for o in s.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
c=s.camera;s.cycles.samples=20;s.render.resolution_x=1300;s.render.resolution_y=1000
# Preserve the adopted reference camera for the front-right render.
s.render.filepath=str(R/'front-right.png');bpy.ops.render.render(write_still=True)
for name,loc,at,scale in [('top-view',(.15,-.20,16),(.15,-.20,1.4),7.3),('roof-junction',(5,-7,6),(.25,0,2.1),4.0),('rear',(5,8,4),(0,0,1.3),7.0)]:
 c.data.type='ORTHO';c.data.ortho_scale=scale;c.location=loc;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 if name=='top-view':s.render.resolution_x=1400;s.render.resolution_y=1400
 else:s.render.resolution_x=1300;s.render.resolution_y=1000
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'CipherSecurities-clean-roof.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'cipher-pediment-solid-v23','roof':counts,'gameApplied':False,'sha256':hashlib.sha256((R/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
