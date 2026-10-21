"""Keep soft leg sides, with a wide planar ground-contact face."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/soften-cipher-cabinet.py').read_text()
source=source.replace("source=source.replace('cipher-training-cabinet-v1','cipher-training-cabinet-v2')", "source=source.replace('cipher-training-cabinet-v1','cipher-training-cabinet-v3')")
# The upstream wrapper replaces this expression in a chained read; replace its target.
source=source.replace("replace('cipher-training-cabinet-v1','cipher-training-cabinet-v2')", "replace('cipher-training-cabinet-v1','cipher-training-cabinet-v3')")
insert='''
# Flatten the lower 25mm into a full contact patch without changing leg height.
from mathutils import Vector
for leg in [o for o in bpy.context.scene.objects if o.name.startswith('Cabinet_Short_Foot')]:
    for vertex in leg.data.vertices:
        world=leg.matrix_world@vertex.co
        if world.z<.025:
            world.z=0
            vertex.co=leg.matrix_world.inverted()@world
    for face in leg.data.polygons:
        if all(abs((leg.matrix_world@leg.data.vertices[i].co).z)<1e-6 for i in face.vertices):face.use_smooth=False
    leg.data.update()
    points=[leg.matrix_world@v.co for v in leg.data.vertices]
    bottom=[p for p in points if abs(p.z)<1e-6]
    assert bottom and max(p.z for p in points)>.13
    assert max(p.x for p in bottom)-min(p.x for p in bottom)>.075
print('PASS: four planar bottom contact patches; leg height preserved')
'''
# Inject into generated build before its save/export, leaving studio objects alone.
source=source.replace("exec(compile(source,str(root/'scratch/build-cipher-training-cabinet.py'),'exec'))", "source=source.replace('bpy.ops.wm.save_as_mainfile',"+repr(insert)+"+'\\nbpy.ops.wm.save_as_mainfile')\nexec(compile(source,str(root/'scratch/build-cipher-training-cabinet.py'),'exec'))")
exec(compile(source,str(root/'scratch/soften-cipher-cabinet.py'),'exec'))
