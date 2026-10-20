"""Remove the blue backing border and gently soften the cabinet's edge shading."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/build-cipher-training-cabinet.py').read_text().replace('cipher-training-cabinet-v1','cipher-training-cabinet-v2')
source=source.replace("box('Cabinet_Door_Recess',(1.30,.025,.53),(0,-.328,.45),dark,.025)", '')
source=source.replace("(.626,.034,.51),(side*.322,-.348,.45),blue,.022", "(.634,.024,.51),(side*.322,-.338,.45),blue,.011")
source=source.replace("side*.075,-.384,.45", "side*.075,-.368,.45")
source=source.replace("(0,0,.455),cream,.065", "(0,0,.455),cream,.085")
source=source.replace("(x,y,.07),cream,.035", "(x,y,.07),cream,.045")
custom='''
import exterior_geometry as geometry
def soft_finish(obj,mat,bevel=.015):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active=obj
    if bevel:
        mod=obj.modifiers.new('Soft_Six_Segment_Edges','BEVEL');mod.width=bevel;mod.segments=6
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for face in obj.data.polygons:face.use_smooth=True
        mod=obj.modifiers.new('Weighted_Flat_Face_Normals','WEIGHTED_NORMAL');mod.weight=50;mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj
geometry.finish=soft_finish
'''
source=source.replace("root=Path('C:/GitHub/StockWars')", custom+"\nroot=Path('C:/GitHub/StockWars')")
exec(compile(source,str(root/'scratch/build-cipher-training-cabinet.py'),'exec'))
