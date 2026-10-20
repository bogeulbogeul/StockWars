"""Warm brass wall lanterns beside the pub's side windows."""
import bpy
import math
from mathutils import Matrix, Vector
from exterior_geometry import material, box, stroke, finish


def build_wall_lanterns():
    brass=material('Pub_Wall_Lantern_Brass',(.29,.145,.033),.43)
    brass.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.55
    glow=material('Pub_Wall_Lantern_Warm_Glass',(1,.66,.26),.40)
    shader=glow.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value=(1,.46,.10,1)
    shader.inputs['Emission Strength'].default_value=3.5
    for side in [-1,1]:
        before=set(bpy.context.scene.objects)
        # Local -Y points into the room; the plate is flush with the plaster.
        box('Wall_Lantern_Mount',(.085,.035,.25),(0,-.018,1.72),brass,.018)
        stroke('Wall_Lantern_Bracket',[(0,-.04,1.81),(0,-.12,1.91),
               (0,-.25,1.91),(0,-.28,1.899)],.011,brass)
        hook=[(0,-.28+.016*math.cos(t),1.883+.016*math.sin(t))
              for t in [math.pi/2+1.5*math.pi*i/40 for i in range(41)]]
        stroke('Wall_Lantern_Rounded_Hook',hook,.009,brass)
        box('Wall_Lantern_Glow',(.145,.145,.23),(0,-.28,1.60),glow,.014)
        box('Wall_Lantern_Base',(.21,.21,.045),(0,-.28,1.46),brass,.012)
        for sx in [-1,1]:
            for sy in [-1,1]:
                stroke('Wall_Lantern_Frame',[(sx*.085,-.28+sy*.085,1.47),
                       (sx*.103,-.28+sy*.103,1.755)],.009,brass)
        box('Wall_Lantern_Continuous_Upper_Rim',(.25,.25,.018),
            (0,-.28,1.747),brass,.005)
        # Four sloped roof panels form a small traditional lantern cap.
        vertices=[(-.125,-.405,1.745),(.125,-.405,1.745),
                  (.125,-.155,1.745),(-.125,-.155,1.745),(0,-.28,1.835)]
        mesh=bpy.data.meshes.new('Wall_Lantern_Cap_Mesh')
        mesh.from_pydata(vertices,[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(3,2,1,0)])
        obj=bpy.data.objects.new('Wall_Lantern_Pitched_Cap',mesh)
        bpy.context.collection.objects.link(obj)
        finish(obj,brass,.007)
        loop=[(.023*math.cos(t),-.28,1.858+.023*math.sin(t))
              for t in [2*math.pi*i/48 for i in range(49)]]
        stroke('Wall_Lantern_Hanging_Loop',loop,.005,brass)
        box('Wall_Lantern_Loop_Socket',(.025,.025,.018),
            (0,-.28,1.836),brass,.006)
        bpy.ops.object.light_add(type='POINT',location=(0,-.33,1.59))
        lamp=bpy.context.object
        lamp.name='Wall_Lantern_Preview_Light'
        lamp.data.energy=9
        lamp.data.color=(1,.53,.20)
        lamp.data.shadow_soft_size=.11
        transform=Matrix.Translation(Vector((side*4,.58,0))) @ Matrix.Rotation(-side*math.pi/2,4,'Z')
        for obj in set(bpy.context.scene.objects)-before:
            obj.matrix_world=transform @ obj.matrix_world
