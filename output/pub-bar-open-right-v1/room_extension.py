"""Extend the entrance by six plank rows without moving rear furniture."""
import bpy
from exterior_geometry import box


def extend_entrance():
    amount=2.40
    for obj in list(bpy.context.scene.objects):
        if obj.type!='MESH':continue
        name=obj.name
        if name.startswith(('Continuous_','Side_Wall','Rectangular_Floor_Base')):
            inverse=obj.matrix_world.inverted()
            for v in obj.data.vertices:
                world=obj.matrix_world @ v.co
                if world.y < -2.5:
                    world.y-=amount
                    v.co=inverse @ world
        elif name.startswith('Central_Exit'):
            obj.location.y-=amount
        elif name.startswith(('Corner_Pillar','Front_Pillar','Front_Side_Curved_Corbel')):
            if obj.location.y < -2.5:obj.location.y-=amount
    mats=[bpy.data.materials['Pub_Plank_'+str(i)] for i in range(4)]
    panel=bpy.data.materials['Pub_Oak_Wainscot']
    for row in range(6):
        cuts=sorted(set([-4,4]+[x for x in [-4+(row%3)*.64+i*1.95 for i in range(6)] if -4<x<4]))
        for i,(a,b) in enumerate(zip(cuts,cuts[1:])):
            box('Entrance_Extension_Floor_Plank',(b-a-.005,.396,.022),
                ((a+b)/2,-3.2-row*.4,.011),mats[(row+i)%4],.001)
    for side in [-1,1]:
        for i in range(6):
            box('Entrance_Extension_Wall_Panel',(.018,.35,.47),
                (side*3.787,-3.08-i*.38,.32),panel,.008)
