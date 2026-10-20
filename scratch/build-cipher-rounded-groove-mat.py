"""Round the actual vertical groove transition, not just the outline."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/build-cipher-clean-inset-mat.py').read_text()
source=source.replace('cipher-cozy-mat-v5','cipher-cozy-mat-v7')
joins='''
for x,y in path+[(.088,.122),(.113,.085)]:
    cx,cy=transform(x,y)
    points=[(cx+.0135*math.cos(i*2*math.pi/48),cy+.0135*math.sin(i*2*math.pi/48)) for i in range(48)]
    cutters.append(prism('Continuous_Round_Arrow_Join',points,.010,.04))
'''
source=source.replace('cut=cutters.pop(0)',joins+'\ncut=cutters.pop(0)')
# Tiny boolean edges previously clamped the bevel globally. Dissolve coplanar
# seams first, then disable overlap clamp so the 2mm vertical fillet is real.
cleanup='''
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0005)
bmesh.ops.dissolve_degenerate(bm,dist=.0005,edges=list(bm.edges))
bmesh.ops.dissolve_limit(bm,angle_limit=.025,verts=list(bm.verts),edges=list(bm.edges),delimit={'MATERIAL'})
bm.to_mesh(body.data);bm.free()
'''
source=source.replace("bevel=body.modifiers.new",cleanup+"\nbevel=body.modifiers.new")
source=source.replace("bevel.width=.0006;bevel.segments=3", "bevel.width=.002;bevel.segments=8;bevel.use_clamp_overlap=True;bevel.limit_method='ANGLE';bevel.angle_limit=.5")
exec(compile(source,str(root/'scratch/build-cipher-clean-inset-mat.py'),'exec'))
