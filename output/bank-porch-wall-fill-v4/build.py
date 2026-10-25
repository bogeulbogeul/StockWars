"""Close the recessed wall voids behind both porch/eaves corners."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'bank-eaves-joint-v3/Bank-eaves-joint.blend'))
s=bpy.context.scene;wall=bpy.data.objects['Smooth_Walls_Windowless_Back'];cream=bpy.data.materials['Bank_Cream']
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and o!=wall}
for side in (-1,1):
 fill=box('Porch_Eaves_Cream_Wall_Infill',(.25,.19,.24),(side*.70,-.970,1.40),cream,.003)
 bpy.context.view_layer.objects.active=wall;m=wall.modifiers.new('Continuous_Porch_Wall_Infill','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=fill
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(fill,do_unlink=True)
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
bm=bmesh.new();bm.from_mesh(wall.data);assert all(e.is_manifold for e in bm.edges);bm.free()
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bank-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.12),4.6),('wall-detail',(3,-5,3),(.66,-1.06,1.43),.85)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bank-filled-porch-wall.blend'))
(R/'validation.json').write_text(json.dumps({'wallClosed':True,'unchangedMeshes':len(before),'symmetricWallInfill':True,'gameApplied':False,'sha256':hashlib.sha256((R/'Bank-clean.glb').read_bytes()).hexdigest()},indent=2))
