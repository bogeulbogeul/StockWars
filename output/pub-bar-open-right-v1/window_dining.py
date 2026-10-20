"""Matching round table and two soft burgundy chairs at the right window."""
import bpy
import math
from mathutils import Matrix, Vector
from exterior_geometry import material
from sofa_geometry import box
from table_geometry import build_table
from table_decor import build_table_decor


def chair(cx,cy,angle,oak,leather):
    before=set(bpy.context.scene.objects)
    box('Dining_Chair_Oak_Seat',(.48,.47,.075),(0,0,.445),oak,.023)
    box('Dining_Chair_Soft_Seat',(.43,.42,.09),(0,0,.505),leather,.038)
    for sx in [-1,1]:
        for sy in [-1,1]:
            box('Dining_Chair_Rounded_Leg',(.065,.065,.40),
                (sx*.18,sy*.18,.222),oak,.015)
        box('Dining_Chair_Back_Post',(.065,.065,.60),
            (sx*.205,.20,.705),oak,.015)
    box('Dining_Chair_Back_Frame',(.47,.075,.36),(0,.21,.855),oak,.035)
    box('Dining_Chair_Back_Cushion',(.37,.085,.265),(0,.158,.855),leather,.039)
    transform=Matrix.Translation(Vector((cx,cy,0))) @ Matrix.Rotation(angle,4,'Z')
    for obj in set(bpy.context.scene.objects)-before:obj.matrix_world=transform @ obj.matrix_world


def build_window_dining():
    x,y=2.78,-1.88
    before=set(bpy.context.scene.objects)
    build_table()
    for obj in set(bpy.context.scene.objects)-before:
        obj.location.x+=x-(-1.67)
        obj.location.y+=y-(-2.98)
    build_table_decor(x,y,.775)
    oak=material('Dining_Chair_Dark_Oak',(.105,.039,.014),.74)
    leather=material('Dining_Chair_Burgundy',(.245,.050,.049),.67)
    # .615 clear between tabletop edge and chair seat edge for sideways walking.
    chair(x,y+1.45,0,oak,leather)
    chair(x,y-1.45,math.pi,oak,leather)
