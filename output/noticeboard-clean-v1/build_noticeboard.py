"""Smooth village noticeboard study, preserving curved header and six notices."""
import bpy
import math
import sys
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,extrude,disk,stroke
# Use denser bevels and smooth shading while weighted normals retain clean faces.
def soften(o):
    for p in o.data.polygons:p.use_smooth=True
    modifier=o.modifiers.new('Smooth_Surface_Normals','WEIGHTED_NORMAL')
    modifier.keep_sharp=True;modifier.weight=50
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return o

original_box=box
def box(name,size,loc,mat,bevel=.015):
    o=original_box(name,size,loc,mat,0)
    if bevel:
        m=o.modifiers.new('Rounded_Continuous_Edges','BEVEL')
        m.width=min(bevel*1.45,min(size)*.42);m.segments=8
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=m.name)
    return soften(o)
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Noticeboard_Honey_Timber',(.46,.25,.10))
dark=material('Noticeboard_Back',(.32,.16,.065))
cork=material('Noticeboard_Matte_Cork',(.48,.30,.14))
stone=material('Noticeboard_Cream_Stone',(.76,.67,.52))
paper=material('Noticeboard_Ivory_Paper',(.96,.87,.67))
gold=material('Noticeboard_Brass_Pin',(.68,.43,.12),.55)
green=material('Noticeboard_Sprout',(.16,.36,.12))
for x in [-1.10,1.10]:
    box('Grounded_Stone_Foot',(.40,.38,.27),(x,0,.135),stone,.065)
    box('Continuous_Timber_Post',(.24,.22,1.95),(x,0,1.19),wood,.06)
    box('Header_Post_Collar',(.34,.29,.19),(x,-.005,1.99),wood,.042)
box('Solid_Back_Panel',(2.05,.105,1.25),(0,.055,1.24),dark,.018)
box('Inset_Cork_Surface',(1.94,.05,1.16),(0,-.014,1.24),cork,.014)
for x in [-1.01,1.01]:box('Inner_Vertical_Frame',(.105,.16,1.32),(x,-.035,1.24),wood,.016)
box('Lower_Continuous_Frame',(2.25,.19,.14),(0,-.025,.58),wood,.022)

def crest(x):return 1.96+.27*math.exp(-(x/.48)**2)
profile=[(-1.02+2.04*i/200,crest(-1.02+2.04*i/200)) for i in range(201)]
extrude('Curved_Header_Body',profile+[(1.02,1.89),(-1.02,1.89)],-.075,.13,wood,.012)
extrude('Continuous_Curved_Header_Edge',[(x,z+.055) for x,z in profile]+[(x,z-.027) for x,z in reversed(profile)],-.12,.125,wood,.012)
# Reuse the exact adopted information-office mark, including cream face and rim.
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'information-sprout-mark-v1/Information-sprout-wall-mark.glb'))
for o in set(bpy.context.scene.objects)-before:
    if o.parent is None:
        o.matrix_world=Matrix.Translation((0,-.085,2.05))@Matrix.Scale(.32,4)@o.matrix_world
    if o.type=='MESH':
        for slot in o.material_slots:
            if slot.material and ('Wood' in slot.material.name or 'Honey' in slot.material.name):slot.material=wood

# Blank presentation notices: content and unlock progression remain separate.
for i,(x,z,w,h) in enumerate([(-.65,1.47,.43,.55),(.05,1.57,.60,.36),(.70,1.57,.32,.36),
                              (-.60,.91,.46,.29),(.01,1.00,.40,.50),(.65,.97,.52,.36)]):
    box('Ivory_Notice_'+str(i),(w,.016,h),(x,-.054,z),paper,.012)
    pin=disk('Round_Brass_Pin',x,-.075,z+h/2-.045,.024,.016,gold)
    soften(pin)

assets=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'NoticeBoard-clean.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
box('Preview_Ground',(200,200,.01),(0,0,-.015),material('Studio_Gray',(.72,.74,.77)),0)
for loc,power,size in [((-4,-5,7),650,5),((4,2,5),350,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.1;scene.camera=cam
for name,loc in [('front',(0,-8,2.8)),('front-right',(4,-8,3.2)),('rear',(4,8,3.2))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(.40,-4,2.30);cam.data.ortho_scale=.65
cam.rotation_euler=(Vector((0,-.10,2.05))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'mark-close.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'NoticeBoard-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 model draft; user visual review and game integration pending',
    'reference':'output/noticeboard-multiview-v1/front.png','design':'Smooth matte honey wood, continuous curved crest, sprout medallion, cork panel and six blank pinned notices',
    'mark_source':'output/information-sprout-mark-v1/Information-sprout-wall-mark.glb; exact meshes at .32 uniform scale; wood matches frame',
    'game_modified':False,'notice_content':'Visual placeholders only; no progression or story changes'},indent=2),encoding='utf-8')
