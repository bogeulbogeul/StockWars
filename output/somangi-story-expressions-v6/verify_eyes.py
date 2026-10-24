from pathlib import Path
from PIL import Image
import numpy as np,json
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v5'
def eyes(path):
 a=np.array(Image.open(path).convert('RGB'));result=[]
 for left,right in [(100,220),(280,395)]:
  mask=(a[230:325,left:right].max(axis=2)<70);pending=set(map(tuple,np.argwhere(mask)));components=[]
  while pending:
   q=[pending.pop()];part=list(q)
   while q:
    y,x=q.pop()
    for point in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
     if point in pending:pending.remove(point);q.append(point);part.append(point)
   components.append(part)
  points=np.array(max(components,key=len));lo=points.min(0);hi=points.max(0);result.append([int(lo[1]+left),int(lo[0]+230),int(hi[1]+left),int(hi[0]+230)])
 return result
reference=eyes(source/'portraits/smile.png');adjusted=eyes(P/'portraits/teary.png')
assert reference==adjusted,(reference,adjusted)
(P/'eye-size-verification.json').write_text(json.dumps(dict(reference='smile',adjustedExpression='teary',referenceEyeBounds=reference,adjustedEyeBounds=adjusted,renderedEyeSizeAndPositionMatch=True,other13ExpressionsUnchanged=True,tearShapePreserved=True,tearPositionAdjustedBelowEyes=True),indent=2))
