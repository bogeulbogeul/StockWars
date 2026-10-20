"""Furniture proportions against the existing 1.0-unit Somangi preview."""
from mathutils import Matrix, Vector

def lower_bar(objects):
    floor=.022
    low=Matrix.Translation((0,0,floor)) @ Matrix.Diagonal((1,1,.75,1)) @ Matrix.Translation((0,0,-floor))
    short_legs=Matrix.Translation((0,0,floor)) @ Matrix.Diagonal((1,1,.80,1)) @ Matrix.Translation((0,0,-floor))
    for obj in objects:
        name=obj.name
        if name.startswith('Stool_Rounded_Leg'):
            transform=short_legs
        elif name.startswith('Stool_'):
            transform=Matrix.Translation((0,0,-.12))
        elif name.startswith(('Backbar_Backing','Backbar_Pillar','Backbar_Shelf',
                              'Shelf_Divider','Backbar_Arched','Backbar_Curved',
                              'Moon_Medallion','Backbar_Golden_Moon')):
            transform=Matrix.Translation((0,0,-.30))
        else:
            transform=low
        obj.matrix_world=transform @ obj.matrix_world

def lower_barrel(objects):
    old=Vector((-2.73,1.84,1.07))
    new=Vector((-2.73,1.84,.022+(1.07-.022)*.75))
    transform=Matrix.Translation(new) @ Matrix.Scale(.90,4) @ Matrix.Translation(-old)
    for obj in objects:obj.matrix_world=transform @ obj.matrix_world
