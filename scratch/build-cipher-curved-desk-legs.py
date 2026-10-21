"""Curve the inner leg shoulders while retaining tabletop, feet and clearance."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/build-cipher-training-desk.py').read_text()
source=source.replace('cipher-training-desk-v1','cipher-training-desk-v2')
source=source.replace('from exterior_geometry import material,finish,box','from exterior_geometry import material,finish,box,extrude')
shape='''
def curved_support(side):
    # Left support: a generous quarter-circle turns the inner vertical leg
    # into the horizontal shoulder beneath the top. Mirror for the right.
    def profile(outer,inner,bottom,spring,radius,top):
        cx=inner+radius
        points=[(outer,bottom),(inner,bottom),(inner,spring)]
        points += [(cx+radius*math.cos(math.pi-i*math.pi/2/24),spring+radius*math.sin(math.pi-i*math.pi/2/24)) for i in range(1,25)]
        points += [(cx,top),(outer,top)]
        return [(-side*x,z) for x,z in points]
    rim=extrude('Training_Desk_Curved_Cream_Rim',profile(-1.23,-.86,.075,.39,.23,.64),-.40,.40,cream,.035)
    body=extrude('Training_Desk_Curved_Blue_Leg',profile(-1.21,-.90,.105,.39,.23,.615),-.415,.38,blue,.03)
    for part in (rim,body):
        for polygon in part.data.polygons:
            polygon.use_smooth=abs(polygon.normal.y)<.9
'''
source=source.replace('for side in [-1,1]:',shape+'\nfor side in [-1,1]:',1)
source=source.replace("column=rounded_slab('Training_Desk_Blue_Support',.36,.90,.14,.09,.53,blue);column.location.x=side*1.08",'curved_support(side)')
exec(compile(source,str(root/'scratch/build-cipher-training-desk.py'),'exec'))
