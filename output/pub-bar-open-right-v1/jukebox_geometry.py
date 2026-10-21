"""Rounded vintage jukebox with warm oak and pastel illuminated arch."""
import bpy
import math
from mathutils import Matrix, Vector
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, stroke, disk


def build_jukebox():
    oak=material('Jukebox_Dark_Oak',(.105,.032,.016),.68)
    gold=material('Jukebox_Brass',(.42,.245,.065),.42)
    dark=material('Jukebox_Speaker_Cloth',(.040,.024,.020),.95)
    cream=material('Jukebox_Cream',(.64,.48,.25),.75)
    blue=material('Jukebox_Display',(.045,.13,.19),.48)
    before=set(bpy.context.scene.objects)
    extrude('Jukebox_Arched_Cabinet',arch_outline(.43,.91,bottom=.08),-.17,.18,oak,.035)
    extrude('Jukebox_Front_Inlay',arch_outline(.365,.91,bottom=.14),-.193,-.17,gold,.012)
    arch_ring('Jukebox_Outer_Brass_Arch',0,.08,.405,.83,.036,-.225,-.165,gold)
    box('Jukebox_Rounded_Base',(.94,.48,.12),(0,0,.082),oak,.04)
    colors=[(.70,.19,.10),(.78,.42,.09),(.52,.62,.18),(.22,.53,.33),(.69,.41,.13)]
    for i,color in enumerate(colors):
        mat=material('Jukebox_Arch_Glow_'+str(i),color,.48)
        shader=mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Emission Color'].default_value=(*color,1)
        shader.inputs['Emission Strength'].default_value=.65
        a=math.pi*i/5
        b=math.pi*(i+1)/5
        points=[(.355*math.cos(t),-.239,.91+.355*math.sin(t))
                for t in [a+(b-a)*j/16 for j in range(17)]]
        stroke('Jukebox_Luminous_Arch',points,.025,mat)
    for side in [-1,1]:
        for i in range(3):
            mat=bpy.data.materials['Jukebox_Arch_Glow_'+str(i)]
            stroke('Jukebox_Side_Light',[(side*.355,-.239,.24+i*.22),
                   (side*.355,-.239,.46+i*.22)],.025,mat)
        box('Jukebox_Side_Column',(.11,.13,.22),(side*.37,-.19,.22),oak,.023)
        for z in [.89,.96]:
            box('Jukebox_Column_Brass_Band',(.13,.14,.025),(side*.37,-.19,z),gold,.007)
    box('Jukebox_Music_Display_Frame',(.54,.055,.28),(0,-.24,.935),oak,.025)
    box('Jukebox_Music_Display',(.48,.014,.215),(0,-.273,.935),blue,.013)
    for row in range(3):
        for col in range(4):
            box('Jukebox_Song_Card',(.086,.008,.040),
                (-.168+col*.112,-.284,.997-row*.062),cream,.006)
    box('Jukebox_Selection_Panel',(.49,.055,.105),(0,-.24,.719),gold,.012)
    for i in range(7):disk('Jukebox_Selection_Button',-.18+i*.06,-.275,.72,.017,.012,cream)
    box('Jukebox_Speaker',(.49,.040,.44),(0,-.22,.421),dark,.060)
    # A continuous rounded border receives every clipped lattice endpoint.
    border=[]
    for cx,cz,start in [(.185,.595,0),(-.185,.595,90),
                         (-.185,.247,180),(.185,.247,270)]:
        for i in range(13):
            angle=math.radians(start+i*90/12)
            border.append((cx+.03*math.cos(angle),-.247,cz+.03*math.sin(angle)))
    stroke('Jukebox_Grille_Continuous_Border',border+[border[0]],.005,gold)
    for slope in [-1,1]:
        for intercept in [-.05,.06,.17,.28,.39,.50,.61,.72,.83]:
            points=[]
            for i in range(501):
                x=-.215+.430*i/500
                z=intercept+slope*x
                dx=max(0,abs(x)-.185)
                dz=max(0,abs(z-.421)-.174)
                if dx*dx+dz*dz<=.03**2:points.append((x,-.247,z))
            if len(points)>1:
                direction=(Vector(points[-1])-Vector(points[0])).normalized()
                points[0]=tuple(Vector(points[0])-direction*.004)
                points[-1]=tuple(Vector(points[-1])+direction*.004)
                stroke('Jukebox_Diamond_Grille',points,.0035,gold)
    disk('Jukebox_Centre_Medallion',0,-.26,.40,.068,.018,gold)
    disk('Jukebox_Centre_Red_Inlay',0,-.273,.40,.048,.012,
         bpy.data.materials['Jukebox_Arch_Glow_0'])
    transform=Matrix.Translation(Vector((3.56,-4.32,.022))) @ Matrix.Rotation(-math.pi/2,4,'Z')
    for obj in set(bpy.context.scene.objects)-before:obj.matrix_world=transform @ obj.matrix_world
