"""Correct the envelope's overlapping paper flap and connected lower folds."""
import bpy,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude,stroke
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-roof-crafted-v6'/'Home-crafted-roof.blend'))
scene=bpy.context.scene;root=bpy.data.objects['Home_Right_Mailbox'];cream=bpy.data.materials['Home_Cream_Plaster']
for o in list(scene.objects):
 if o.name.startswith(('Mailbox_Envelope_Flap_Fold','Mailbox_Envelope_Lower_Fold')):bpy.data.objects.remove(o,do_unlink=True)
before=set(scene.objects)
fold=bpy.data.materials.new('Mailbox_Envelope_Soft_Crease');fold.use_nodes=True
shader=fold.node_tree.nodes['Principled BSDF'];shader.inputs['Base Color'].default_value=(.57,.49,.37,1);shader.inputs['Roughness'].default_value=.9
paper=cream.copy();paper.name='Mailbox_Envelope_Flap_Ivory'
# Lower folds run continuously under the overlapping triangular top flap.
# Their visible ends meet that flap exactly; no detached short diagonal marks.
for x in (-.063,.027):
 stroke('Mailbox_Envelope_Connected_Lower_Fold',[(x,-.1445,.417),(-.018,-.1445,.459)],.0008,fold)
flap=extrude('Mailbox_Envelope_Overlapping_Paper_Flap',
 [(-.063,.473),(.027,.473),(-.018,.438)],-.147,-.1425,paper,.0008)
stroke('Mailbox_Envelope_Continuous_V_Crease',
 [(-.0625,-.1474,.4725),(-.018,-.1474,.4385),(.0265,-.1474,.4725)],.00075,fold)
for o in [o for o in scene.objects if o not in before]:o.parent=root
bpy.context.view_layer.update()
mail={root,*root.children_recursive}
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)
export('Home-with-right-mailbox.glb',asset)
export('Home-redesign.glb',[o for o in asset if o not in mail])
position=root.location.copy();root.location=(0,0,0);bpy.context.view_layer.update()
export('Mailbox-right.glb',mail)
root.location=position;bpy.context.view_layer.update()
scene.cycles.samples=32;cam=scene.camera;cam.data.type='ORTHO'
scene.render.resolution_x=1200;scene.render.resolution_y=1000
views=[('front-right',(4,-6,3.1),(.10,-.08,1.05),3.65),
 ('mailbox-detail',(2.4,-3.4,1.1),(1.35,-1.10,.36),.84),
 ('envelope-detail',(1.55,-3,.66),(1.335,-1.215,.445),.255)]
for name,loc,target,scale in views:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(4,-6,3.1);cam.data.ortho_scale=3.65
cam.rotation_euler=(Vector((.10,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-correct-envelope.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':'home-roof-crafted-v6','envelope':'overlapping closed top flap with connected lower folds',
 'houseDoorAndRoofUnchanged':True,'gameApplied':False,
 'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.glob('*.glb')}},indent=2))
