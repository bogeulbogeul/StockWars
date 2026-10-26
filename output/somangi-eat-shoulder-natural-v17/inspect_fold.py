import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path('C:/GitHub/StockWars/output/somangi-eat-shoulder-natural-v17');sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'));rest=np.array([tuple(v.co) for v in bpy.data.objects['Somangi_SmoothBody'].data.vertices])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.context.scene.frame_set(33,subframe=.5);ob=bpy.data.objects['Somangi_SmoothBody'];co=points(ob);faces=[list(f.vertices) for f in ob.data.polygons];tree=BVHTree.FromPolygons([Vector(p) for p in co],faces)
for x,y in [(205,290),(215,290),(225,285),(205,300),(215,300),(225,300),(200,310)]:
    hit,normal,f,d=tree.ray_cast(Vector((2,-.1+(x-240)*2.55/520,(260-y)*2.55/520)),Vector((-1,0,0)),4)
    ids=faces[f];along=[]
    for i in ids:
        if i<len(rest):along.append(float((rest[i]-np.array([.285,0,-.11]))@np.array([.195,0,-.33])/np.linalg.norm([.195,0,-.33])))
    print(x,y,'HIT',tuple(hit),'IDS',ids,'ALONG',along)
