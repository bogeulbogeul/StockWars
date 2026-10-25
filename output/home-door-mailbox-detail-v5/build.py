"""Door surface refinement and detailed right mailbox, preserving house proportions."""
import bpy,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'));sys.path.insert(0,str(ROOT))
from exterior_geometry import box
from mailbox import build as build_mailbox
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-door-balance-v4'/'Home-balanced-door.blend'))
scene=bpy.context.scene;wood=bpy.data.materials['Home_Honey_Wood'];cream=bpy.data.materials['Home_Cream_Plaster']
red=bpy.data.materials['Home_Terracotta_Tiles'];gold=bpy.data.materials['Home_Brass_Handle'];dark=bpy.data.materials['Home_Wood_Grooves']
# Remove the discarded square panel and restore the uncut door blank.
for o in list(scene.objects):
 if o.name.startswith(('Home_Door_Continuous_Panel_Moulding','Home_Door_Clean_Panel_Inset','Home_Door_Recessed_Lower_Panel')):
  bpy.data.objects.remove(o,do_unlink=True)
door=bpy.data.objects['Home_Arched_Wood_Door']
with bpy.data.libraries.load(str(ROOT.parent/'home-inset-door-window-v8'/'Home-inset-window.blend'),link=False) as (src,dst):
 dst.objects=['Home_Arched_Wood_Door']
template=dst.objects[0];door.data=template.data.copy();bpy.data.objects.remove(template,do_unlink=True)
for v in door.data.vertices:
 p=door.matrix_world@v.co
 if p.z<.16:p.z-=.010*min(1,max(0,(.16-p.z)/.04));v.co=door.matrix_world.inverted()@p
# Five fine vertical recesses below the round glass; no raised square panel.
door_front=min((door.matrix_world@v.co).y for v in door.data.vertices)
for x in (.275,.3525,.430,.5075,.585):
 cutter=box('Door_Vertical_Groove_Cutter',(.004,.014,.405),(x,door_front+.002,.380),wood,.0018)
 bpy.context.view_layer.objects.active=door
 mod=door.modifiers.new('Fine_Vertical_Wood_Groove','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
root=bpy.data.objects['Home_Right_Mailbox']
for o in list(root.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
mail_objects=build_mailbox(root,wood,cream,red,gold,dark)
bpy.context.view_layer.update()
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
mail=set(mail_objects)|{root}
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)
export('Home-with-right-mailbox.glb',asset)
export('Home-redesign.glb',[o for o in asset if o not in mail])
position=root.location.copy();root.location=(0,0,0);bpy.context.view_layer.update()
export('Mailbox-right.glb',mail)
root.location=position;bpy.context.view_layer.update()
cam=scene.camera;cam.data.type='ORTHO';scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
for name,loc,target,scale in [('front-right',(4,-6,3.1),(.10,-.08,1.05),3.65),
 ('mailbox-detail',(2.4,-3.4,1.1),(1.35,-1.10,.36),.84),
 ('door-detail',(1,-4,1.35),(.43,-.85,.61),1.22)]:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
# Save the editable project with the whole-building preview camera.
cam.location=(4,-6,3.1);cam.data.ortho_scale=3.65
cam.rotation_euler=(Vector((.10,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-door-mailbox-detail.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':'home-door-balance-v4','door':'fine vertical recessed planks',
 'mailboxPlacement':'right, unchanged','gameApplied':False,
 'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.glob('*.glb')}},indent=2))
