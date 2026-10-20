"""Continuous arched door surround, inset joinery and curved brass hardware."""
import math
import bpy
from exterior_geometry import arch_outline, extrude, box, stroke, disk, material
from bookstore_window import surround


def build_door(wood,glass,gold):
    cx=-.92
    leaf=material('Door_Warm_Timber',(.37,.178,.063))
    shadow=material('Door_Rebate_Shadow',(.16,.079,.031))
    panel=material('Door_Inset_Timber',(.40,.201,.077))
    def arch(r,bottom,spring):
        return [(cx+x,bottom+z) for x,z in arch_outline(r,spring,steps=96)]
    surround('Door_Continuous_Arch_Surround',arch(.391,.211,.789),
             arch(.331,.226,.774),-.993,-.885,wood)
    extrude('Door_Recess_Shadow',arch(.332,.225,.775),-.935,-.901,shadow,.004)
    extrude('Arched_Wood_Entry',arch(.320,.234,.766),-.953,-.927,leaf,.008)
    surround('Door_Arched_Glass_Bead',arch(.259,.750,.250),
             arch(.232,.777,.223),-.974,-.949,wood)
    extrude('Entry_Inset_Glass',arch(.240,.770,.230),-.959,-.951,glass,.004)
    def rect(w,h,r):
        pts=[]
        for x,z,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),
                      (-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
            for i in range(17):
                t=math.radians(a+i*90/16)
                pts.append((cx+x+r*math.cos(t),.477+z+r*math.sin(t)))
        return pts
    surround('Door_Lower_Panel_Moulding',rect(.506,.385,.018),
             rect(.447,.326,.012),-.975,-.949,wood)
    extrude('Door_Lower_Recessed_Panel',rect(.450,.329,.013),-.956,-.949,panel,.004)
    # Smooth pull with two round rosettes and rounded returns into the door.
    x=cx+.253
    for z in [.607,.729]:
        disk('Door_Handle_Rosette',x,-.973,z,.020,.018,gold)
    pts=[]
    for i in range(65):
        t=i/64
        pts.append((x,-.979-.044*math.sin(math.pi*t)**.6,.607+.122*t))
    stroke('Door_Brass_Curved_Pull',pts,.009,gold)
    for z in [.424,1.002]:
        box('Door_Hinge_Plate',(.026,.012,.062),(cx-.306,-.963,z),gold,.004)
        stroke('Door_Hinge_Barrel',[(cx-.315,-.974,z-.025),(cx-.315,-.974,z+.025)],.008,gold)
