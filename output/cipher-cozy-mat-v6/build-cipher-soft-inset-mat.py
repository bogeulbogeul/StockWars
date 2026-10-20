"""Connected round joins and softer recessed edges; preserve v5 source."""
from pathlib import Path
root=Path('C:/GitHub/StockWars')
source=(root/'scratch/build-cipher-clean-inset-mat.py').read_text()
source=source.replace('cipher-cozy-mat-v5','cipher-cozy-mat-v6')
joins='''
# Round disks bridge both offset sides of each bend, including arrowhead joints.
for x,y in path+[(.088,.122),(.113,.085)]:
    cx,cy=transform(x,y)
    points=[(cx+.0135*math.cos(i*2*math.pi/48),cy+.0135*math.sin(i*2*math.pi/48)) for i in range(48)]
    cutters.append(prism('Continuous_Round_Arrow_Join',points,.010,.04))
'''
source=source.replace('cut=cutters.pop(0)',joins+'\ncut=cutters.pop(0)')
source=source.replace("bevel.width=.0006;bevel.segments=3","bevel.width=.0018;bevel.segments=6")
exec(compile(source,str(root/'scratch/build-cipher-clean-inset-mat.py'),'exec'))
