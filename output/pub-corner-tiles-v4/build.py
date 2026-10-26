"""Fill both omitted porch/eaves corner regions with fitted burgundy tiles."""
import bpy,sys,json,hashlib,importlib.util
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
spec=importlib.util.spec_from_file_location('bank_roof_geometry',R.parent/'bank-redesign-v2/roof.py')
roof=importlib.util.module_from_spec(spec);spec.loader.exec_module(roof)
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'pub-wide-v3/Pub-wide.blend'))
s=bpy.context.scene;clay=bpy.data.materials['Pub_Burgundy']
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH'}
edge=(1.98-roof.mh(-1.07))/roof.PS
transform=Matrix.Translation((0,0,-.0208))@Matrix.Diagonal((1.12*1.08,1.08,1.02,1))
for side in (-1,1):
 poly=[(side*(edge+.004),-1.074),(side*.723,-1.074),(side*.723,roof.seam(.723)+.008)]
 for fn in [lambda x,y:y+1.168,lambda x,y:-1.172-y]:
  p=roof.clip(poly,fn)
  o=roof.solid('Pub_Fitted_Corner_Tile',p,lambda x,y:2.22+roof.MS*y,clay,.035,.028,.004)
  o.matrix_world=transform@o.matrix_world
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Pub-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.18),5.25),('corner-detail',(3,-5,3),(.80,-1.17,1.46),1.0),('front',(0,-7,2.8),(0,-.08,1.18),5.25)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Pub-filled-corner-tiles.blend'))
(R/'validation.json').write_text(json.dumps({'source':'pub-wide-v3','newBurgundyCornerTiles':4,'unchangedMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'Pub-clean.glb').read_bytes()).hexdigest()},indent=2))
