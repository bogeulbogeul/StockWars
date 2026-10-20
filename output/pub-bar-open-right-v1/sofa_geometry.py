"""Low burgundy wall banquette with a dark oak frame."""
import bpy
import json
from pathlib import Path
from sofa_pillow import build_pillow
from exterior_geometry import material, box as base_box


def box(name,size,loc,mat,bevel):
    obj=base_box(name,size,loc,mat,0)
    bpy.context.view_layer.objects.active=obj
    edge=obj.modifiers.new('Soft_Rounded_Edges','BEVEL')
    edge.width=bevel
    edge.segments=10
    bpy.ops.object.modifier_apply(modifier=edge.name)
    if 'Cushion' in name or 'Pillow' in name:
        soft=obj.modifiers.new('Soft_Upholstery_Surface','SUBSURF')
        soft.levels=2
        bpy.ops.object.modifier_apply(modifier=soft.name)
    else:
        normal=obj.modifiers.new('Smooth_Oak_Normals','WEIGHTED_NORMAL')
        normal.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=normal.name)
    for face in obj.data.polygons:face.use_smooth=True
    return obj


def build_sofa():
    oak=material('Pub_Sofa_Dark_Oak',(.105,.039,.014),.74)
    inset=material('Pub_Sofa_Oak_Panel',(.135,.052,.022),.78)
    leather=material('Pub_Sofa_Burgundy',(.245,.050,.049),.67)
    gold=material('Pub_Sofa_Ochre_Pillow',(.40,.235,.075),.91)
    x,y=-3.22,-3.10
    box('Sofa_Oak_Base',(.83,2.90,.26),(x,y,.22),oak,.035)
    box('Sofa_Oak_Front_Rail',(.09,2.85,.10),(x+.40,y,.35),oak,.018)
    box('Sofa_Oak_Back',(.11,2.80,.72),(x-.37,y,.62),oak,.035)
    for i in range(4):
        cy=y-1.065+i*.71
        box('Sofa_Front_Inset_Panel',(.022,.63,.16),(x+.425,cy,.22),inset,.015)
        seat=box('Sofa_Rounded_Seat_Cushion',(.66,.695,.18),(x+.02,cy,.45),leather,.085)
        seat['seat_id']='pub_sofa_'+str(i+1)
        seat['sittable']=i!=0
        seat['blocked_reason']='decorative_pillow' if i==0 else ''
        back=box('Sofa_Rounded_Back_Cushion',(.24,.695,.53),
                 (x-.235,cy,.745),leather,.110)
        back.rotation_euler.y=-.10
    for sign in [-1,1]:
        cy=y+sign*1.47
        box('Sofa_Oak_End_Panel',(.85,.12,.55),(x,cy,.325),oak,.025)
        box('Sofa_End_Inner_Panel',(.67,.024,.31),(x,cy+sign*.065,.31),inset,.018)
        box('Sofa_Rounded_Armrest',(.93,.20,.105),(x+.015,cy,.625),oak,.035)
        for sx in [-1,1]:
            box('Sofa_Rounded_Foot',(.15,.16,.11),
                (x+sx*.30,cy,.077),oak,.025)
    # Broad face rests toward the entrance arm; lower edge stays above the seat.
    build_pillow((x+.145,y-1.325,.790),gold)
    seats=[{'id':'pub_sofa_'+str(i+1),'sittable':i!=0,
            'blocked_reason':'decorative_pillow' if i==0 else None,
            'position_blender':[x+.02,y-1.065+i*.71,.54]} for i in range(4)]
    (Path(__file__).parent/'sofa-seating.json').write_text(json.dumps({
        'status':'asset seating contract; pub gameplay integration pending',
        'seats':seats},indent=2),encoding='utf-8')
