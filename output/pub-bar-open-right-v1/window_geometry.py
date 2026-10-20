"""Inset arched diamond windows for the two side walls of the pub."""
import bpy
import math
from mathutils import Vector, Matrix
from exterior_geometry import material, box, extrude, arch_outline, arch_ring, stroke

def build_windows():
    oak=material('Pub_Window_Oak',(.105,.042,.015),.72)
    glass=material('Pub_Window_Dusk_Blue',(.10,.245,.36),.45)
    shader=glass.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value=(.05,.12,.20,1)
    shader.inputs['Emission Strength'].default_value=.15
    walls=[o for o in bpy.context.scene.objects if o.name.startswith('Side_Wall')]
    for side in [-1,1]:
        name='Left_Window' if side<0 else 'Right_Window'
        transform=Matrix.Translation((side*4,-.65,0)) @ Matrix.Rotation(-side*math.pi/2,4,'Z')
        before=set(bpy.context.scene.objects)
        # Glazing/opening overlap beneath the frame avoids slivers of plaster.
        contour=[(x,.83+z) for x,z in arch_outline(.575,.77)]
        cutter=extrude(name+'_Opening_Cutter',contour,-.20,.30,oak,0)
        cutter.matrix_world=transform
        wall=min(walls,key=lambda o:abs(o.location.x-side*4.07))
        bpy.context.view_layer.objects.active=wall
        cut=wall.modifiers.new('Real_Window_Opening','BOOLEAN')
        cut.operation='DIFFERENCE'
        cut.solver='EXACT'
        cut.object=cutter
        bpy.ops.object.modifier_apply(modifier=cut.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
        extrude(name+'_Glass',contour,.040,.060,glass,.003)
        arch_ring(name+'_Arch_Frame',0,.85,.55,.75,.070,-.080,.15,oak)
        box(name+'_Lower_Frame',(1.27,.23,.065),(0,.015,.85),oak,.012)
        box(name+'_Sill',(1.34,.36,.085),(0,-.010,.795),oak,.016)
        # Recess the lattice toward the glass and bury all ends in the frame.
        for slope in [-1,1]:
            for intercept in [.48,.78,1.08,1.38,1.68,1.98,2.28]:
                points=[]
                for i in range(241):
                    x=-.55+1.10*i/240
                    z=intercept+slope*x
                    upper=1.60+math.sqrt(max(0,.55**2-x*x))
                    if .85<=z<=upper:points.append((x,.023,z))
                if len(points)<2:continue
                direction=(Vector(points[-1])-Vector(points[0])).normalized()
                points[0]=tuple(Vector(points[0])-direction*.035)
                points[-1]=tuple(Vector(points[-1])+direction*.035)
                stroke(name+'_Inset_Diamond',points,.012,oak)
        for obj in set(bpy.context.scene.objects)-before:
            obj.matrix_world=transform @ obj.matrix_world
