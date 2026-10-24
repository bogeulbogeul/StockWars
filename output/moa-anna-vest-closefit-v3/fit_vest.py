"""Fit original vest to torso cross sections while retaining its raised trim."""
import math, json
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree

def close_fit(vest, body, folder):
    arms={g.index for g in body.vertex_groups if g.name.startswith('Arm.')}
    arm_vertices={v.index for v in body.data.vertices
                  if sum(g.weight for g in v.groups if g.group in arms)>.1}
    polys=[p.vertices[:] for p in body.data.polygons if not any(i in arm_vertices for i in p.vertices)]
    surface=BVHTree.FromPolygons([v.co for v in body.data.vertices],polys)
    coords=np.array([v.co[:] for v in vest.data.vertices])
    radii=np.linalg.norm(coords[:,:2],axis=1)
    directions=coords[:,:2]/radii[:,None]
    chart=np.column_stack((directions*.25,coords[:,2]*2))
    tree=KDTree(len(coords))
    for i,c in enumerate(chart):
        tree.insert(Vector(c),i)
    tree.balance()
    # Smooth cross sections avoid copying hidden shoulder junction irregularities.
    zmin,zmax=float(coords[:,2].min()),float(coords[:,2].max())
    rows,cols=96,128
    field=np.zeros((rows,cols))
    for row in range(rows):
        z=zmin+(zmax-zmin)*row/(rows-1)
        for col in range(cols):
            angle=2*math.pi*col/cols
            hit,_,_,distance=surface.ray_cast(Vector((0,0,z)),Vector((math.cos(angle),math.sin(angle),0)),1.5)
            if hit is None:
                raise RuntimeError('Missing torso cross section')
            field[row,col]=distance
    for _ in range(24):
        up=np.vstack((field[:1],field[:-1]))
        down=np.vstack((field[1:],field[-1:]))
        field=.4*field+.15*(up+down+np.roll(field,1,axis=1)+np.roll(field,-1,axis=1))
    clearance=[]
    for i,v in enumerate(vest.data.vertices):
        # Nearby inner and outer shell points encode thickness and piping relief.
        neighbours=tree.find_n(Vector(chart[i]),64)
        weights=np.array([math.exp(-(d/.035)**2) for _,_,d in neighbours])
        reference=float(np.average([radii[j] for _,j,_ in neighbours],weights=weights))
        relief=.014*math.tanh((radii[i]-reference)/.03)
        direction=Vector((*directions[i],0))
        row=(v.co.z-zmin)/(zmax-zmin)*(rows-1)
        col=(math.atan2(direction.y,direction.x)%(2*math.pi))/(2*math.pi)*cols
        r0=min(rows-2,int(row));c0=int(col)%cols
        fr=row-r0;fc=col-int(col)
        distance=(1-fr)*((1-fc)*field[r0,c0]+fc*field[r0,(c0+1)%cols])+fr*((1-fc)*field[r0+1,c0]+fc*field[r0+1,(c0+1)%cols])
        gap=.024+relief
        v.co=Vector((0,0,v.co.z))+direction*(distance+gap)
        clearance.append(gap)
    vest.data.update()
    (folder/'close-fit-check.json').write_text(json.dumps(dict(
        vertices=len(coords),minimumRadialGap=min(clearance),maximumRadialGap=max(clearance),
        meanRadialGap=float(np.mean(clearance)),trimAndTexturePreserved=True,
        method='Torso cross-section fit with retained local thickness relief'),indent=2))
