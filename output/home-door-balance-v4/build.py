"""Separate knob and lower panel visually, preserving their sizes."""
import bpy
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-door-panel-v3'/'Home-smaller-panel.blend'))
for o in bpy.context.scene.objects:
    if o.name.startswith(('Home_Door_Knob','Home_Door_Brass_Escutcheon')):
        o.matrix_world=Matrix.Translation((-.025,0,0))@o.matrix_world
for name in ('Home_Door_Continuous_Panel_Moulding','Home_Door_Clean_Panel_Inset'):
    o=bpy.data.objects[name];o.matrix_world=Matrix.Translation((0,0,-.045))@o.matrix_world
# Recreate the door's base surface and cut the panel at its new height.
door=bpy.data.objects['Home_Arched_Wood_Door']
with bpy.data.libraries.load(str(ROOT.parent/'home-inset-door-window-v8'/'Home-inset-window.blend'),link=False) as (src,dst):
    dst.objects=['Home_Arched_Wood_Door']
template=dst.objects[0];door.data=template.data.copy();bpy.data.objects.remove(template,do_unlink=True)
for v in door.data.vertices:
    p=door.matrix_world@v.co
    if p.z<.16:p.z-=.010*min(1,max(0,(.16-p.z)/.04));v.co=door.matrix_world.inverted()@p
import sys
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
cut=box('Panel_Cutter',(.275,.055,.245),(.43,-.855,.350),door.data.materials[0],.008)
bpy.context.view_layer.objects.active=door
m=door.modifiers.new('Lowered_Panel_Recess','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
s=bpy.context.scene;mailroot=bpy.data.objects['Home_Right_Mailbox'];mail=set(mailroot.children_recursive)|{mailroot}
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
for filename,objects in [('Home-with-right-mailbox.glb',asset),('Home-redesign.glb',[o for o in asset if o not in mail])]:
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/filename),export_format='GLB',use_selection=True)
c=s.camera;c.location=(1,-4,1.7);c.data.ortho_scale=1.5;c.rotation_euler=(Vector((.43,-.85,.60))-c.location).to_track_quat('-Z','Y').to_euler()
s.render.filepath=str(ROOT/'door-detail.png');s.cycles.samples=24;bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-balanced-door.blend'))
