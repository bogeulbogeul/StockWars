"""Reuse the exact adopted home-mailbox envelope on the post collection box."""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'post-office-roof-v2/PostOffice-pitched-roof.blend'))
s=bpy.context.scene
old=[o for o in s.objects if o.name.startswith('Mailbox_Envelope_')]
body=bpy.data.objects['Mailbox_Envelope_Ivory_Body']
pts=[body.matrix_world@Vector(v) for v in body.bound_box]
target=Vector(tuple((min(p[i] for p in pts)+max(p[i] for p in pts))/2 for i in range(3)))
width=max(p.x for p in pts)-min(p.x for p in pts)
def sig(o):
 if o.type!='MESH':return None
 return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and o not in old}
for o in old:bpy.data.objects.remove(o,do_unlink=True)
source=R.parent/'home-envelope-correct-v7/Home-correct-envelope.blend'
with bpy.data.libraries.load(str(source),link=False) as (src,dst):
 dst.objects=[n for n in src.objects if n.startswith('Mailbox_Envelope_')]
loaded=[o for o in dst.objects if o]
scale=width/.104
placement=Matrix.Translation(target)@Matrix.Scale(scale,4)@Matrix.Translation((.018,.140,-.445))
names=[]
for o in loaded:
 local=o.matrix_basis.copy();o.parent=None;o.matrix_world=placement@local
 o.name='Post_Shared_'+o.name
 s.collection.objects.link(o);names.append(o.name)
bpy.context.view_layer.update()
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'PostOffice.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,ortho in [('front-right',(4,-6,3.5),(0,-.08,1.18),4.8),('mailbox-detail',(3,-5,2),(1.02,-1.29,.60),1.35),('envelope-detail',(1.25,-4,.83),tuple(target),.46)]:
 c.location=loc;c.data.ortho_scale=ortho;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'PostOffice-shared-envelope.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'post-office-roof-v2','envelopeSource':str(source),'sameEnvelopeGeometryAndMaterials':True,'uniformScale':scale,'targetCenter':list(target),'parts':names,'unchangedMeshes':len(before),'homeAssetChanged':False,'gameApplied':False,'sha256':hashlib.sha256((R/'PostOffice.glb').read_bytes()).hexdigest()},indent=2))
