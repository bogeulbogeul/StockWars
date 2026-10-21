"""Double-sided book relief on a bracket anchored to the left side wall."""
import math
import bpy
from mathutils import Matrix, Vector
from exterior_geometry import box, extrude, stroke, disk, material


def build_side_sign(wood, gold, paper, dark):
    cx, cy, cz = -1.99, -.38, 1.16
    enamel = material('Side_Sign_Plum_Enamel', (.105,.035,.065), .68)
    page_edge = material('Side_Sign_Page_Edges', (.71,.57,.34))
    # Mount penetrates the side wall slightly; the beam seats inside the plate.
    box('Side_Sign_Wall_Mount',(.09,.23,.34),(-1.565,cy,1.42),wood,.018)
    box('Side_Sign_Bracket',(.79,.085,.075),(-1.91,cy,1.585),wood,.018)
    stroke('Side_Sign_Curved_Brace',[
        (-1.60-.39*t,cy,1.31+.24*math.sin(t*math.pi/2))
        for t in [i/48 for i in range(49)]],.018,gold)
    for z in [1.32,1.52]:
        # Brass fasteners face out from the left wall.
        bolt=disk('Side_Sign_Mount_Bolt',0,0,0,.016,.012,gold)
        bolt.rotation_euler=(0,math.pi/2,0);bolt.location=(-1.618,cy,z)
    box('Side_Sign_Rounded_Wood_Frame',(.62,.095,.43),(cx,cy,cz),wood,.035)
    for face in [-1,1]:
        y=cy+face*.052
        box('Side_Sign_Plum_Inset',(.558,.018,.369),(cx,y,cz),enamel,.025)
        # A single closed rounded brass inlay around each face.
        rim=[]
        for x,z,a in [(.244,.149,0),(-.244,.149,90),(-.244,-.149,180),(.244,-.149,270)]:
            for i in range(17):
                angle=math.radians(a+90*i/16)
                rim.append((cx+x+.017*math.cos(angle),y+face*.012,cz+z+.017*math.sin(angle)))
        stroke('Side_Sign_Continuous_Brass_Rim',rim+[rim[0]],.0035,gold)
        for side in [-1,1]:
            # Layered silhouettes show a bound cover, page block and curled top sheet.
            for layer,(mat,scale,offset) in enumerate([(gold,1.045,.019),(page_edge,1,.026),(paper,.97,.032)]):
                contour=[]
                for i in range(49):
                    t=i/48
                    contour.append((cx+side*(.012+.207*t)*scale,
                                    cz+(.089+.038*math.sin(math.pi*t)-.008*t)*scale))
                for i in range(48,-1,-1):
                    t=i/48
                    contour.append((cx+side*(.012+.207*t)*scale,
                                    cz+(-.109+.031*math.sin(math.pi*t)-.006*t)*scale))
                if side<0:contour.reverse()
                depth=y+face*offset
                extrude('Side_Sign_Book_Relief',contour,min(depth,depth+face*.008),max(depth,depth+face*.008),mat,.003)
            for line in range(2):
                pts=[]
                for i in range(33):
                    t=.12+.78*i/32
                    pts.append((cx+side*(.012+.207*t)*.97,y+face*.042,
                                cz-.084+line*.012+.023*math.sin(math.pi*t)))
                stroke('Side_Sign_Page_Engraving',pts,.0017,page_edge)
        stroke('Side_Sign_Book_Spine',[(cx,y+face*.044,cz-.108),(cx,y+face*.044,cz+.087)],.006,gold)
    for x in [cx-.19,cx+.19]:
        # Closed oval loops, seated into both the beam and the plaque.
        points=[(x+.018*math.cos(t),cy,1.452+.109*math.sin(t))
                for t in [2*math.pi*i/64 for i in range(65)]]
        stroke('Side_Sign_Brass_Hanging_Loop',points,.009,gold)


def build_front_sign():
    """Reuse the finished front face at gable scale, with a flush wall mounting."""
    origin=Vector((-1.99,-.38,1.16))
    target=Vector((-.94,-.935,1.95))
    transform=Matrix.Translation(target) @ Matrix.Diagonal((1.16,1,1.10,1)) @ Matrix.Translation(-origin)
    prefixes=('Side_Sign_Rounded_Wood_Frame','Side_Sign_Plum_Inset',
              'Side_Sign_Continuous_Brass_Rim','Side_Sign_Book_Relief',
              'Side_Sign_Page_Engraving','Side_Sign_Book_Spine')
    for obj in list(bpy.context.scene.objects):
        if not obj.name.startswith(prefixes):
            continue
        if not obj.name.startswith('Side_Sign_Rounded_Wood_Frame'):
            if obj.type=='MESH':
                points=[obj.matrix_world @ v.co for v in obj.data.vertices]
            else:
                points=[obj.matrix_world @ Vector(p.co[:3]) for s in obj.data.splines for p in s.points]
            if sum(p.y for p in points)/len(points)>origin.y:
                continue
        clone=obj.copy();clone.data=obj.data.copy()
        clone.name=obj.name.replace('Side_Sign_','Front_Sign_')
        bpy.context.collection.objects.link(clone)
        clone.matrix_world=transform @ obj.matrix_world
