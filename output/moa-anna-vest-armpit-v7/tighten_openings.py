"""Raise lower armhole rims and narrow front/back gaps after the torso fit."""
import math,json

def smooth(t):
    t=max(0,min(1,t))
    return t*t*(3-2*t)

def tighten(vest,folder):
    changed=0
    largest=0
    for vertex in vest.data.vertices:
        x,y,z=vertex.co
        side=smooth((abs(x)-.18)/.075)
        height=smooth((z+.285)/.12)
        local=smooth((.23-abs(y))/.10)
        weight=side*height*local
        if weight<1e-6:continue
        target_z=-.04+(z+.04)*.50
        new_y=y*(1-.45*weight)
        new_z=z+(target_z-z)*weight
        largest=max(largest,math.hypot(new_y-y,new_z-z))
        vertex.co=(x,new_y,new_z)
        changed+=1
    vest.data.update()
    (folder/'opening-refinement.json').write_text(json.dumps(dict(
        modifiedVertices=changed,maximumDisplacement=largest,
        action='Raise lower armhole boundary; narrow front and rear arcs toward the arm root',
        topologyUVTexturesUnchanged=True,bodyUnchanged=True),indent=2))
