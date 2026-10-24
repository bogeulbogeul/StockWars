"""Locally align the supplied vest's existing armholes with Moa's shoulder roots."""
import math,json

def smooth(value):
    value=max(0,min(1,value))
    return value*value*(3-2*value)

def fit_armholes(vest,folder):
    changed=0
    for vertex in vest.data.vertices:
        x,y,z=vertex.co
        # Restrict the adjustment to the upper sides, leaving front opening/hem intact.
        side=smooth((abs(x)-.17)/.11)
        height=smooth((z+.365)/.12)
        weight=side*height
        if weight<1e-6:continue
        target_z=-.10+(z+.15)*.75
        target_x=math.copysign(.255+(abs(x)-.255)*.86,x)
        vertex.co=(x+(target_x-x)*weight,
                   y*(1-.32*weight),z+(target_z-z)*weight)
        changed+=1
    vest.data.update()
    (folder/'armhole-check.json').write_text(json.dumps(dict(
        modifiedVestVertices=changed,sourceTopologyUVMaterialsPreserved=True,
        bodyVerticesChanged=0,localChange='Raise and shorten upper side openings; reduce front/back clearance',
        targetShoulderX=.255,armholeCenterZ=-.10),indent=2))
