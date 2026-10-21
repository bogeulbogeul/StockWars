"""Continuous arched timber frame, recessed glazing and a single joined cross."""
import math
import bpy
from mathutils import Matrix
from exterior_geometry import arch_outline, extrude, material
from bookstore_window import surround


def build_side_window(wood,glass):
    before=set(bpy.context.scene.objects)
    shadow=material('Side_Window_Rebate_Shadow',(.13,.078,.038))
    def outline(r,bottom,spring):
        return [(x,bottom+z) for x,z in arch_outline(r,spring,steps=96)]
    # Closed annuli include the lower rail and smoothly join the arch to its jambs.
    surround('Side_Window_Continuous_Arch_Frame',outline(.285,.525,.365),
             outline(.24,.57,.32),-.985,-.89,wood)
    surround('Side_Window_Inset_Rebate',outline(.242,.567,.323),
             outline(.224,.585,.305),-.952,-.903,shadow)
    extrude('Right_Side_Window_Glass',outline(.234,.577,.313),-.928,-.906,glass,.004)
    h=.016
    # One solid avoids overlapping faces and the dark pinhole at the intersection.
    cross=[(-h,.560),(h,.560),(h,.89-h),(.248,.89-h),
           (.248,.89+h),(h,.89+h),(h,1.139),(-h,1.139),
           (-h,.89+h),(-.248,.89+h),(-.248,.89-h),(-h,.89-h)]
    extrude('Side_Window_Unified_Cross',cross,-.968,-.920,wood,.004)
    transform=Matrix.Translation((.545,.15,0)) @ Matrix.Rotation(math.pi/2,4,'Z')
    for obj in set(bpy.context.scene.objects)-before:
        obj.matrix_world=transform @ obj.matrix_world
