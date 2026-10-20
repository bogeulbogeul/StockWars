"""Layered envelope relief and continuous village sign joinery."""
import math
from exterior_geometry import box, extrude, disk, material
from bookstore_window import surround


def rounded(w,h,r,z=1.98):
    pts=[]
    for x,y,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),
                  (-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(17):
            t=math.radians(a+i*90/16)
            pts.append((x+r*math.cos(t),z+y+r*math.sin(t)))
    return pts


def build_sign(wood,gold,paper,dark,red):
    flap=material('Sign_Flap_Ivory',(.96,.86,.67))
    side=material('Sign_Envelope_Side_Paper',(.86,.75,.56))
    box('Sign_Solid_Timber_Back',(1.02,.10,.47),(0,-.975,1.98),wood,.045)
    surround('Sign_Continuous_Raised_Timber_Rim',rounded(1.02,.47,.045),
             rounded(.919,.369,.032),-1.047,-1.005,wood)
    box('Sign_Recessed_Red_Field',(.93,.024,.38),(0,-1.025,1.98),dark,.032)
    surround('Sign_Continuous_Brass_Inlay',rounded(.894,.344,.027),
             rounded(.875,.325,.023),-1.044,-1.035,gold)
    # A single thin paper body, with folded panels rather than applied linework.
    box('Envelope_Ivory_Body',(.65,.028,.27),(0,-1.071,1.98),paper,.011)
    for s in [-1,1]:
        extrude('Envelope_Folded_Side',[(s*.315,1.855),(s*.315,2.105),
                (0,1.980)],-1.088,-1.083,side,.003)
    # The lower fold reaches the centre, with both diagonal edges joining the
    # outer corners; its upper tip is tucked beneath the top closure.
    extrude('Envelope_Folded_Bottom',
            [(-.314,1.855),(.314,1.855),(0,1.994)],
            -1.094,-1.085,paper,.004)
    extrude('Envelope_Overlapping_Top_Flap',
            [(-.314,2.105),(.314,2.105),(.018,1.957),
             (.009,1.953),(0,1.952),(-.009,1.953),(-.018,1.957)],
            -1.103,-1.091,flap,.004)
    for x in [-.465,.465]:
        for z in [1.799,2.161]:
            disk('Sign_Brass_Pin',x,-1.052,z,.009,.008,gold)
