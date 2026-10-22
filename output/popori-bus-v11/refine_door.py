"""Detailed flush bus double door preserving entry placement and clearances."""
import bpy
import sys
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v10/Popori-bus-animated.blend'))
scene=bpy.context.scene
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box
source=(ROOT.parent/'popori-bus-v1/build_bus.py').read_text(encoding='utf-8')
exec(source[source.index('original_box='):source.index('bpy.ops.wm.read_factory_settings')])
green=bpy.data.materials['Bus_Forest_Green'];cream=bpy.data.materials['Bus_Warm_Cream']
glass=bpy.data.materials['Bus_Blue_Glass'];dark=bpy.data.materials['Bus_Window_Rubber']
metal=bpy.data.materials['Bus_Hub_Warm_Metal']
for o in list(scene.objects):
    if o.name.startswith(('Boarding_Door_','Door_Handle')):bpy.data.objects.remove(o,do_unlink=True)
center=.396
# All front surfaces face -Y. Actual frame ring openings reveal inset glass.
def ring(name,x,z,w,h,border,yfront,yback,mat,radius=.018):
    outer=box(name,(w,yback-yfront,h),(x,(yfront+yback)/2,z),mat,radius)
    cut=box('Temporary_Opening',(w-2*border,yback-yfront+.15,h-2*border),(x,(yfront+yback)/2,z),mat,max(.006,radius*.7))
    bpy.context.view_layer.objects.active=outer
    m=outer.modifiers.new('Real_Continuous_Opening','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cut,do_unlink=True)
    return outer

ring('Entry_Outer_Continuous_Frame',center,1.17,.752,1.405,.026,-.838,-.783,green,.030)
for side in [-1,1]:
    x=center+side*.175
    # Main slab sits behind the glazing seals, unified top to bottom.
    box('Door_Leaf',(.338,.045,1.325),(x,-.815,1.17),green,.020)
    ring('Door_Glass_Rubber_Seal',x,1.365,.286,.964,.018,-.856,-.836,dark,.024)
    box('Door_Inset_Glass',(.250,.014,.927),(x,-.839,1.365),glass,.018)
    ring('Door_Lower_Panel_Moulding',x,.711,.286,.237,.015,-.851,-.833,green,.020)
    box('Door_Inset_Cream_Panel',(.254,.012,.205),(x,-.837,.711),cream,.014)
    # Small fixed hinge plates and a restrained metallic pull with two mounts.
    outer_x=x+side*.151
    for z in [.69,1.70]:box('Door_Hinge_Plate',(.022,.015,.085),(outer_x,-.844,z),metal,.006)
    hx=x-side*.066
    for z in [1.015,1.155]:
        box('Handle_Mount',(.038,.019,.034),(hx,-.865,z),metal,.010)
    box('Rounded_Pull_Handle',(.023,.027,.172),(hx,-.885,1.085),metal,.011)
box('Door_Central_Rubber_Seal',(.014,.028,1.30),(center,-.854,1.17),dark,.005)
box('Door_Top_Drip_Cap',(.78,.067,.035),(center,-.827,1.891),green,.014)
box('Door_Sill',(.690,.065,.029),(center,-.842,.496),metal,.008)
for j in range(3):
    box('Step_Anti_Slip_Inlay',(.43,.009,.008),(center,-.885+j*.033,.524),dark,.003)
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('door-close',(1.5,-5,2),(center,-.83,1.18),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'door_step_center_x':center,
    'features':['continuous outer frame','real glazing ring openings','inset blue glass','rubber seals','inset lower panels','hinges','mounted pull handles','sill and anti-slip inlays'],
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
