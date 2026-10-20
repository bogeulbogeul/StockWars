"""Closed single oak door fitted inside the existing basement arch."""
import bpy
import math
from exterior_geometry import material, extrude, disk, finish, box


def build_door():
    before=set(bpy.context.scene.objects)
    oak=material('Basement_Door_Dark_Oak',(.115,.048,.019),.76)
    seam=material('Basement_Door_Seam',(.055,.020,.008),.85)
    brass=material('Basement_Door_Handle_Brass',(.42,.25,.075),.36)
    brass.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.65
    cx=2.65
    radius=.479
    spring=1.505
    bottom=.035
    def top(x):return spring+math.sqrt(max(0,radius*radius-x*x))
    outline=[(cx-radius,bottom),(cx+radius,bottom)]
    outline += [(cx+radius*math.cos(math.pi*i/64),
                 spring+radius*math.sin(math.pi*i/64)) for i in range(65)]
    extrude('Basement_Closed_Door_Core',outline,2.985,3.075,seam,.004)
    # Narrow shallow joints read as boards within one closed leaf.
    for i in range(6):
        left=-radius+i*radius*2/6+.003
        right=-radius+(i+1)*radius*2/6-.003
        contour=[(cx+left,bottom+.004),(cx+right,bottom+.004)]
        contour += [(cx+right+(left-right)*j/12,
                     top(right+(left-right)*j/12)-.004) for j in range(13)]
        extrude('Basement_Door_Oak_Board',contour,2.967,2.992,oak,.005)
    # One ordinary round knob, with its small mounting rose.
    disk('Basement_Door_Knob_Rose',cx-.29,2.953,.91,.044,.025,brass)
    disk('Basement_Door_Knob_Stem',cx-.29,2.924,.91,.016,.045,brass)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,
        radius=.035,location=(cx-.29,2.895,.91))
    knob=bpy.context.object
    knob.name='Basement_Door_Single_Round_Knob'
    finish(knob,brass,0)
    for p in knob.data.polygons:p.use_smooth=True
    frame_mat=bpy.data.objects.get('Basement_Door_Frame').data.materials[0]
    for sign in [-1,1]:
        box('Basement_Door_Jamb_Seal',(.09,.38,1.51),
            (cx+sign*.5175,3.11,.775),frame_mat,.004)
    # Bring the closed leaf forward into the frame rebate, avoiding an open
    # black reveal beside the projecting lower wall trim.
    for obj in set(bpy.context.scene.objects)-before:
        obj.location.y-=.115
    for obj in before:
        if obj.name.startswith('Basement_Door_Frame') and obj.type=='MESH':
            for vertex in obj.data.vertices:
                world=obj.matrix_world @ vertex.co
                if world.y<2.93:
                    world.y-=.115
                    vertex.co=obj.matrix_world.inverted() @ world
