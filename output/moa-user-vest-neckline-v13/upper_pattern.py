"""Separate neckline drop from shoulder and armhole fitting on the original garment."""
import math,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def ease(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def refine(vest,body,folder):
    arm_groups={g.index for g in body.vertex_groups if g.name.startswith('Arm.')}
    arms={v.index for v in body.data.vertices if sum(g.weight for g in v.groups if g.group in arm_groups)>.1}
    tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],
        [p.vertices[:] for p in body.data.polygons if not any(i in arms for i in p.vertices)])
    changed=0
    for vertex in vest.data.vertices:
        x,y,z=vertex.co
        upper=ease((z+.21)/.24)
        medial=1-ease((abs(x)-.12)/.13)
        # A lower neckline makes skin and an actual shoulder strap readable.
        drop=upper*(.05+.07*medial)
        # Keep a separate, open armhole around the shoulder root.
        side=ease((abs(x)-.19)/.08)
        lower_arc=math.exp(-((z+.18)/.065)**2)
        near_side=1-ease((abs(y)-.10)/.15)
        rise=.025*side*lower_arc*near_side
        new_y=y*(1-.08*side*upper)
        new_y+=math.copysign(.012*medial*upper,y)
        new_z=z-drop+rise
        # Lowering the neckline changes the skin cross-section beneath it.
        # Keep its front/back shell outside that new cross-section.
        sign=-1 if new_y<0 else 1
        hit,_,_,_=tree.ray_cast(Vector((x,sign*2,new_z)),Vector((0,-sign,0)),4)
        if hit is not None and new_z>-.22:
            minimum=abs(hit.y)+.009
            current=abs(new_y)
            outside=.5*(current+minimum+math.sqrt((current-minimum)**2+.005**2))
            blend=ease((new_z+.22)/.09)
            new_y=sign*(current+(outside-current)*blend)
        vertex.co=(x,new_y,new_z)
        changed+=upper>0 or rise>.00001
    vest.data.update()
    (folder/'pattern-check.json').write_text(json.dumps(dict(
        modifiedVertices=changed,maximumNecklineDrop=.12,maximumShoulderDrop=.05,
        maximumLowerArmholeRise=.025,sourceTopologyUVAndMaterialsUnchanged=True),indent=2))
