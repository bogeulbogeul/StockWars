"""Use the same home-mailbox paper envelope relief for the building sign."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'post-office-envelope-match-v3/PostOffice-shared-envelope.blend'))
s=bpy.context.scene
old=[o for o in s.objects if o.name.startswith('Envelope_')]
body=bpy.data.objects['Envelope_Ivory_Body']
pts=[body.matrix_world@Vector(v) for v in body.bound_box]
target=Vector(tuple((min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3)))
# Use a uniform fit inside the existing red field, retaining a clear border.
scale=.215/.070
field=bpy.data.objects['Sign_Recessed_Red_Field']
front=min((field.matrix_world@Vector(v)).y for v in field.bound_box)
target.y=front+.003-.004*scale
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and o not in old}
for o in old:bpy.data.objects.remove(o,do_unlink=True)
source=R.parent/'home-envelope-correct-v7/Home-correct-envelope.blend'
with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.objects=[n for n in src.objects if n.startswith('Mailbox_Envelope_')]
placement=Matrix.Translation(target)@Matrix.Scale(scale,4)@Matrix.Translation((.018,.140,-.445))
names=[]
for o in [o for o in dst.objects if o]:
 local=o.matrix_basis.copy();o.parent=None;o.matrix_world=placement@local;o.name='Post_Sign_Shared_'+o.name
 s.collection.objects.link(o);names.append(o.name)
bpy.context.view_layer.update()
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'PostOffice.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,ortho in [('front-right',(4,-6,3.5),(0,-.08,1.18),4.8),('sign-detail',(1,-5,2.6),(0,-1.0,1.92),1.15),('envelope-detail',(.15,-4,2.05),tuple(target),.64)]:
 c.location=loc;c.data.ortho_scale=ortho;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'PostOffice-shared-envelope-sign.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'post-office-envelope-match-v3','sharedEnvelopeSource':str(source),'sameShapeAndMaterials':True,'uniformSignScale':scale,'parts':names,'unchangedMeshes':len(before),'frameAndMailboxUnchanged':True,'gameApplied':False,'sha256':hashlib.sha256((R/'PostOffice.glb').read_bytes()).hexdigest()},indent=2))
