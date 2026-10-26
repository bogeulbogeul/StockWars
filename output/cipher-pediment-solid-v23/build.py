"""Replace separate gable/beam joins with one recessed, closed pediment solid."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
sys.path.insert(0,str(ROOT.parent/'cipher-reference-architecture-v20'))
from exterior_geometry import extrude
from projection import design
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-junctions-sealed-v22'/'CipherSecurities-sealed-junctions.blend'))
scene=bpy.context.scene;d=design();cream=bpy.data.materials['Trim_Cream'];front=d['front']
retired=('Pediment_Continuous_Frame','Pediment_Cream_Field','Pediment_Closed_Roof_Rebate','Portico_Continuous_Entablature')
for o in list(scene.objects):
 if o.name.startswith(retired):bpy.data.objects.remove(o,do_unlink=True)
# A single outline includes the horizontal beam and both sloping gable borders.
# Its bottom is truly level, rather than a sloping triangle resting above a box.
left=d['left'];right=d['right'];peak=d['peak']
outer=[(left[0]+.025,1.78),(right[0]-.025,1.78),
 (right[0]-.025,right[2]-.015),(peak[0],peak[2]-.022),(left[0]+.025,left[2]-.015)]
body=extrude('Pediment_Unified_Closed_Solid',outer,front-.018,front+.15,cream,0)
# Cut a shallow, blind triangular recess: the field still has a closed back.
inner=[(left[0]+.23,1.940),(right[0]-.23,1.940),(peak[0],peak[2]-.13)]
cutter=extrude('Pediment_Recess_Cutter',inner,front-.08,front+.028,cream,0)
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Closed_Triangular_Recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
# Fuse the side cornices into the same solid, including their front corner ends.
cornices=[o for o in scene.objects if o.name.startswith('Central_Closed_Cream_Cornice')]
for part in cornices:
 bpy.context.view_layer.objects.active=body
 mod=body.modifiers.new('Continuous_Side_Return','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=part
 bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(part,do_unlink=True)
bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Soft_Continuous_Edges','BEVEL');mod.width=.003;mod.segments=3
bpy.ops.object.modifier_apply(modifier=mod.name)
bm=bmesh.new();bm.from_mesh(body.data)
boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges)
bm.free();assert boundary==0 and nonmanifold==0,(boundary,nonmanifold)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.cycles.samples=32;scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-solid-pediment.blend'))
cam=scene.camera;cam.data.type='ORTHO';scene.render.resolution_x=1100;scene.render.resolution_y=720;scene.cycles.samples=24
for name,loc,target,scale in [('gable-detail',(1,-8,2.65),(.37,-2.13,2.23),2.85),
 ('corner-detail',(4,-7,2.65),(1.44,-1.88,1.88),1.35)]:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'cipher-junctions-sealed-v22',
 'singlePedimentBeamAndSideReturns':True,'boundaryEdges':boundary,'nonManifoldEdges':nonmanifold,
 'blindRecess':True,'roofAndMarkUnchanged':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
