"""Copy torso faces and weights, then add an outward shell and small rounded binding."""
import bpy, math, json
import numpy as np
from collections import Counter,defaultdict
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def make_vest(body,rig,reference,folder):
    source=body.data
    arms={g.index for g in body.vertex_groups if g.name.startswith('Arm.')}
    def eligible(v):
        x,y,z=v.co
        if sum(g.weight for g in v.groups if g.group in arms)>.08:
            return False
        angle=abs(math.atan2(x,-y))
        top=-.045-.19*abs(math.sin(angle))**6
        t=max(0,min(1,(-z-.045)/.41))
        opening=.53*(1-t)+.26*t
        bottom=-.455+.035*math.exp(-max(0,angle-opening)/.18)
        return bottom<z<top and angle>opening
    valid={v.index for v in source.vertices if eligible(v)}
    polys=[p for p in source.polygons if all(i in valid for i in p.vertices)]
    ids=sorted({i for p in polys for i in p.vertices})
    remap={v:i for i,v in enumerate(ids)}
    coords=[source.vertices[i].co.copy() for i in ids]
    faces=[tuple(remap[i] for i in p.vertices) for p in polys]
    edges=Counter(tuple(sorted((f[j],f[(j+1)%len(f)]))) for f in faces for j in range(len(f)))
    boundary=[e for e,count in edges.items() if count==1]
    neighbours=defaultdict(list)
    for a,b in boundary:
        neighbours[a].append(b);neighbours[b].append(a)
    # Fair only cut edges and reproject them to the actual unmodified body.
    torso_polys=[p.vertices[:] for p in source.polygons
                 if not any(sum(g.weight for g in source.vertices[i].groups if g.group in arms)>.08 for i in p.vertices)]
    tree=BVHTree.FromPolygons([v.co for v in source.vertices],torso_polys)
    for _ in range(240):
        updated={}
        for i,ns in neighbours.items():
            if len(ns)!=2:
                continue
            point=coords[i]*.5+(coords[ns[0]]+coords[ns[1]])*.25
            hit,_,_,_=tree.find_nearest(point)
            updated[i]=hit
        for i,point in updated.items():
            coords[i]=point
    normals=[]
    for i,old in enumerate(ids):
        normal=source.vertices[old].normal.copy()
        radial=Vector((coords[i].x,coords[i].y,0))
        if normal.dot(radial)<0:
            normal=-normal
        normals.append(normal)
        coords[i]+=normal*.006
    # Keep source olive hue, sampled from its actual base colour texture.
    material=reference.data.materials[0]
    bsdf=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    image=bsdf.inputs['Base Color'].links[0].from_node.image
    pixels=np.array(image.pixels[:],dtype=np.float32).reshape(-1,4)[::16,:3]
    green=pixels[(pixels[:,1]>.15)&(pixels[:,1]>pixels[:,2]*1.2)]
    rgb=np.median(green,axis=0)
    linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
    mat=bpy.data.materials.new('AnnaVest sampled olive cloth')
    mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*linear,1)
    shader.inputs['Roughness'].default_value=.78
    data=bpy.data.meshes.new('Copied Moa torso garment')
    data.from_pydata(coords,[],faces);data.update()
    vest=bpy.data.objects.new('Moa_SurfaceVest',data)
    bpy.context.scene.collection.objects.link(vest)
    data.materials.append(mat)
    for p in data.polygons:
        p.use_smooth=True
    # Retain smooth source surface normals, independent of newly cut boundaries.
    from mathutils.kdtree import KDTree
    normal_tree=KDTree(len(coords))
    for i,point in enumerate(coords):normal_tree.insert(point,i)
    normal_tree.balance()
    smooth_normals=[]
    for i,point in enumerate(coords):
        ns=[normals[j] for _,j,_ in normal_tree.find_n(point,32) if normals[j].dot(normals[i])>.5]
        smooth_normals.append(sum(ns,Vector()).normalized())
    data.normals_split_custom_set_from_vertices(smooth_normals)
    for group in body.vertex_groups:
        vest.vertex_groups.new(name=group.name)
    for new,old in enumerate(ids):
        for g in source.vertices[old].groups:
            vest.vertex_groups[g.group].add([new],g.weight,'REPLACE')
    vest.parent=rig
    vest.modifiers.new('Same body weights','ARMATURE').object=rig
    solid=vest.modifiers.new('Thin outward cloth','SOLIDIFY')
    solid.thickness=.005;solid.offset=1
    # Build continuous rounded binding along each copied patch boundary.
    unseen=set(neighbours)
    curves=[]
    while unseen:
        start=next(iter(unseen));chain=[start];prev=None;current=start
        for _ in range(len(neighbours)+1):
            candidates=[j for j in neighbours[current] if j!=prev]
            if not candidates:break
            nxt=candidates[0]
            if nxt==start:break
            if nxt in chain:break
            chain.append(nxt);prev,current=current,nxt
        unseen.difference_update(chain)
        if len(chain)<8:continue
        curve=bpy.data.curves.new('Rounded vest binding','CURVE')
        curve.dimensions='3D';curve.bevel_depth=.004;curve.bevel_resolution=3
        spline=curve.splines.new('POLY');spline.points.add(len(chain)-1)
        for point,i in zip(spline.points,chain):
            point.co=(*(coords[i]+normals[i]*.005),1)
        spline.use_cyclic_u=True
        ob=bpy.data.objects.new('Moa_VestBinding',curve)
        bpy.context.scene.collection.objects.link(ob)
        curve.materials.append(mat)
        bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
        bpy.context.view_layer.objects.active=ob
        bpy.ops.object.convert(target='MESH')
        ob=bpy.context.object
        ob.vertex_groups.new(name='Body').add(list(range(len(ob.data.vertices))),1,'REPLACE')
        ob.parent=rig;ob.modifiers.new('Follow body','ARMATURE').object=rig
        curves.append(ob)
    (folder/'surface-check.json').write_text(json.dumps(dict(
        copiedBodyVertices=len(ids),copiedBodyFaces=len(faces),sameBodyWeights=True,
        skinOffset=.006,outwardThickness=.005,bindingRadius=.004,
        sourceOliveSRGB=rgb.tolist(),boundaryLoops=len(curves)),indent=2))
    return vest,curves
