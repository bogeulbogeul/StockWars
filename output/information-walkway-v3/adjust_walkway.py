"""Widen cabinet aisles and the rear cross-aisle; audit a walking envelope."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-drawer-pair-v2'/'Office-two-cabinets-preview.blend'))
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    names=[m.name for m in obj.data.materials if m]
    world=obj.matrix_world.copy()
    if any(n.startswith('Cabinet_') for n in names):
        world.translation.x+=.85 if world.translation.x>0 else -.85
    elif any(n.startswith(('Desk_','Props_','Visitor_Stool_')) for n in names):
        world.translation.y-=.60
    obj.matrix_world=world
visitor=bpy.data.objects['Somangi_Visitor_Seated_Preview']
visitor.location.y-=.60
for obj in bpy.context.scene.objects:
    if obj.name.startswith(('Application_Surface_Anchor','Somangi_Visitor_Seat_Anchor')):
        obj.location.y-=.60
bpy.context.view_layer.update()

def bounds(prefix,side=None):
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and
             any(m and m.name.startswith(prefix) for m in o.data.materials)]
    if side is not None:objects=[o for o in objects if (o.matrix_world.translation.x>0)==(side>0)]
    points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
    return [min(p.x for p in points),max(p.x for p in points),min(p.y for p in points),max(p.y for p in points)]

obstacles={'chair':bounds('Anna_Chair_'),'desk':bounds('Desk_'),
           'left_cabinet':bounds('Cabinet_',-1),'right_cabinet':bounds('Cabinet_',1),
           'visitor_stool':bounds('Visitor_Stool_')}
radius=.4841 # measured walking width .86802 / 2 plus .05 margin
route=[(1.10,2.23),(1.10,1.39),(2.20,1.39),(2.20,-.80)]
min_clearance=999
for sign in [-1,1]:
    path=[(x*sign,y) for x,y in route]
    for a,b in zip(path,path[1:]):
        steps=math.ceil(math.dist(a,b)/.01)
        for i in range(steps+1):
            t=i/steps;x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t
            assert -3.76+radius<x<3.76-radius
            for name,(lo,hi,front,back) in obstacles.items():
                distance=math.hypot(max(lo-x,0,x-hi),max(front-y,0,y-back))
                min_clearance=min(min_clearance,distance-radius)
                assert distance>=radius,(name,x,y,distance)
report={'method':'2D circle vs measured furniture bounds, both paths sampled every .01 units',
    'walk_width':.86802,'envelope_radius_with_margin':radius,
    'minimum_extra_clearance':min_clearance,'obstacles':obstacles,
    'right_exit_path':route,'left_exit_path':[(-x,y) for x,y in route],
    'cabinet_centers_x':[-2.15,2.15],'desk_and_visitor_shift_y':-.60,
    'chair_cabinet_aisle':1.305,'rear_cross_aisle':1.12,
    'result':'PASS for sampled exit paths starting beside chair',
    'pending':['sit-to-stand and step off chair','runtime collision and path following'],
    'game_changed':False}
(ROOT/'walkway-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=6.5;cam.location=(2.6,-4.5,4.3)
cam.rotation_euler=(Vector((0,.6,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-walkway-preview.blend'))
print(json.dumps(report))
