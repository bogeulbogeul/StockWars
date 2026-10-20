"""Small gold-trimmed card-suit plaque above the basement door."""
import math
import bpy
from exterior_geometry import material, extrude, stroke, disk, finish


def build_door_sign():
    oak=material('Basement_Sign_Oak',(.085,.029,.010),.74)
    gold=material('Basement_Sign_Gold',(.52,.285,.060),.43)
    cx,cz=2.65,2.31
    outline=[(-.45,-.085),(-.38,-.155),(.38,-.155),(.45,-.085),
             (.45,.085),(.38,.155),(-.38,.155),(-.45,.085)]
    extrude('Basement_Card_Sign',[(cx+x,cz+z) for x,z in outline],2.79,2.915,oak,.012)
    edge=[(cx+x*.89,2.777,cz+z*.78) for x,z in outline]
    stroke('Basement_Sign_Golden_Border',edge+[edge[0]],.009,gold)
    extrude('Basement_Sign_Diamond',[(cx-.17,cz+.104),(cx-.095,cz),
            (cx-.17,cz-.104),(cx-.245,cz)],2.755,2.779,gold,.004)
    # Inverted heart silhouette forms the pointed crown of the spade.
    spade=[]
    for i in range(65):
        t=2*math.pi*i/64
        x=16*math.sin(t)**3
        z=13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)
        spade.append((cx+.17+x*.0052,cz+.008-z*.0052))
    symbol=extrude('Basement_Sign_Spade',spade,2.755,2.779,gold,0)
    stem=extrude('Basement_Sign_Spade_Stem',[(cx+.151,cz+.015),(cx+.189,cz+.015),
            (cx+.205,cz-.105),(cx+.135,cz-.105)],2.754,2.780,gold,0)
    bpy.context.view_layer.objects.active=symbol
    union=symbol.modifiers.new('Continuous_Spade_Stem','BOOLEAN')
    union.operation='UNION'
    union.solver='EXACT'
    union.object=stem
    bpy.ops.object.modifier_apply(modifier=union.name)
    bpy.data.objects.remove(stem,do_unlink=True)
    finish(symbol,gold,.002)
    for sign in [-1,1]:
        disk('Basement_Sign_Pin',cx+sign*.365,2.77,cz,.012,.012,gold)
