"""Fit the timber beneath the new gold corner tiles to their roof outline."""
import bpy,bmesh,sys,json,hashlib,importlib.util
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
spec=importlib.util.spec_from_file_location('bank_roof_helpers',R.parent/'bank-redesign-v2/roof.py')
roof=importlib.util.module_from_spec(spec);spec.loader.exec_module(roof)
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'pub-corner-tiles-v4/Pub-filled-corner-tiles.blend'))
s=bpy.context.scene;frame=bpy.data.objects['Porch_Continuous_Timber_Frame'];wood=bpy.data.materials['Pub_Warm_Timber']
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and o!=frame and o.name!='Porch_Cream_Pediment'}
fit=Matrix.Translation((0,0,-.0208))@Matrix.Diagonal((1.12*1.08,1.08,1.02,1))
frame.matrix_world=fit.inverted()@frame.matrix_world
bpy.data.objects['Porch_Cream_Pediment'].matrix_world=fit.inverted()@bpy.data.objects['Porch_Cream_Pediment'].matrix_world
bpy.context.view_layer.update()
edge=(1.98-roof.mh(-1.07))/roof.PS
for side in (-1,1):
 # Remove the rectangular side extension behind the front triangular fascia.
 # The face of the entry pediment and its horizontal header stay untouched.
 cut=box('Old_Boxed_Timber_Cut',(.24,.38,.40),(side*.72,-1.06,1.42),wood,0)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Remove_Boxed_Corner','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name)
 cut.scale.x=1.05;cut.scale.y=1.03
 pediment=bpy.data.objects['Porch_Cream_Pediment'];bpy.context.view_layer.objects.active=pediment
 m=pediment.modifiers.new('Hidden_Corner_Back_Trim','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
 # Closed timber support follows the same clipped footprint and pitch as gold.
 poly=[(side*(edge-.012),-1.045),(side*.727,-1.045),(side*.727,roof.seam(.727)-.008)]
 support=roof.solid('Roof_Fitted_Timber_Corner',poly,lambda x,y:2.22+roof.MS*y,wood,.075,-.012,.003)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Joined_Roof_Fitted_Timber','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=support
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(support,do_unlink=True)
 bridge=box('Hidden_Horizontal_Eaves_Bridge',(.17,.17,.074),(side*.785,-.990,1.443),wood,.003)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Continuous_Header_Return','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=bridge
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(bridge,do_unlink=True)
bpy.data.objects['Porch_Cream_Pediment'].location.y+=.006
bpy.context.view_layer.objects.active=frame
m=frame.modifiers.new('Unified_Closed_Timber_Surface','REMESH');m.mode='VOXEL';m.voxel_size=.0025;m.use_smooth_shade=False
bpy.ops.object.modifier_apply(modifier=m.name)
m=frame.modifiers.new('Gentle_Surface_Finish','SMOOTH');m.factor=.25;m.iterations=2;bpy.ops.object.modifier_apply(modifier=m.name)
bm=bmesh.new();bm.from_mesh(frame.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
print('TIMBER_BOUNDARY',sum(e.is_boundary for e in bm.edges),'NONMANIFOLD',sum(not e.is_manifold for e in bm.edges))
assert all(e.is_manifold for e in bm.edges)
bm.to_mesh(frame.data);bm.free()
frame.matrix_world=fit@frame.matrix_world
bpy.data.objects['Porch_Cream_Pediment'].matrix_world=fit@bpy.data.objects['Porch_Cream_Pediment'].matrix_world
bpy.context.view_layer.update()
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Pub-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.18),5.25),('timber-detail',(3,-5,3),(.80,-1.17,1.46),1.0),('front',(0,-7,2.8),(0,-.08,1.18),5.25)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Pub-roof-fitted-timber.blend'))
(R/'validation.json').write_text(json.dumps({'roofFittedTimberClosed':True,'unchangedMeshes':len(before),'goldTilesUnchanged':True,'gameApplied':False,'sha256':hashlib.sha256((R/'Pub-clean.glb').read_bytes()).hexdigest()},indent=2))

