"""Improve the roof craft while preserving the adopted door and right mailbox."""
import bpy,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'));sys.path.insert(0,str(ROOT))
from roof import build as build_roof
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-door-mailbox-detail-v5'/'Home-door-mailbox-detail.blend'))
scene=bpy.context.scene;stats=build_roof(bpy.data.materials['Home_Terracotta_Tiles'])
root=bpy.data.objects['Home_Right_Mailbox'];mail={root,*root.children_recursive}
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
cam=scene.camera;cam.data.type='ORTHO';scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
views=[('front-right',(4,-6,3.1),(.10,-.08,1.05),3.65),
 ('roof-detail',(3,-5,3.4),(.12,-.10,1.91),2.75),
 ('ridge-detail',(.9,-3,2.65),(0,-.60,2.07),1.30),
 ('chimney-detail',(3,-3,2.7),(.66,.35,1.75),1.20)]
for name,loc,target,scale in views:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(4,-6,3.1);cam.data.ortho_scale=3.65
cam.rotation_euler=(Vector((.10,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-crafted-roof.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':'home-door-mailbox-detail-v5','roof':stats,
 'doorMailboxAndHouseProportionsUnchanged':True,'gameApplied':False,
 'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.glob('*.glb')}},indent=2))
