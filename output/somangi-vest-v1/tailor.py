"""A new, continuous vest pattern fitted to the accepted Somangi body."""
import bpy,math,json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def tailor(body,rig,folder):
    arms={g.index for g in body.vertex_groups if g.name.startswith('Arm.')}
    excluded={v.index for v in body.data.vertices if sum(g.weight for g in v.groups if g.group in arms)>.1}
    faces=[p.vertices[:] for p in body.data.polygons if not any(i in excluded for i in p.vertices)]
    tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],faces)
    # Fit a smooth cloth envelope rather than copy hidden shoulder surface seams.
    zlo,zhi=-.48,-.025
    nr,na=96,160
    radii=np.zeros((nr,na))
    for i in range(nr):
        z=zlo+(zhi-zlo)*i/(nr-1)
        for j in range(na):
            a=2*math.pi*j/na
            hit,_,_,distance=tree.ray_cast(Vector((0,0,z)),Vector((math.sin(a),-math.cos(a),0)),1.2)
            if hit is None:raise RuntimeError('Missing torso section')
            radii[i,j]=distance
    for _ in range(36):
        up=np.vstack((radii[:1],radii[:-1]));down=np.vstack((radii[1:],radii[-1:]))
        radii=.4*radii+.15*(up+down+np.roll(radii,1,axis=1)+np.roll(radii,-1,axis=1))
    def radius(z,a):
        row=max(0,min(nr-1,(z-zlo)/(zhi-zlo)*(nr-1)))
        col=(a%(2*math.pi))/(2*math.pi)*na
        i=min(nr-2,int(row));j=int(col)%na;u=row-i;v=col-int(col)
        return (1-u)*((1-v)*radii[i,j]+v*radii[i,(j+1)%na])+u*((1-v)*radii[i+1,j]+v*radii[i+1,(j+1)%na])
    rows,cols=64,192
    vertices=[]
    for i in range(rows+1):
        t=i/rows
        corner=max(0,min(1,(t-.80)/.20))
        corner=corner*corner*(3-2*corner)
        opening=.70*(1-t)+.27*t+.12*corner
        for j in range(cols+1):
            a=opening+(2*math.pi-2*opening)*j/cols
            # Shoulder bands meet the front and back; scoop low around each arm.
            side_distance=min(abs(a-math.pi/2),abs(a-3*math.pi/2))
            top=-.035-.165*math.exp(-(side_distance/.30)**2)
            edge=min(j,cols-j)/cols
            bottom=-.455+.055*math.exp(-edge/.045)
            z=top*(1-t)+bottom*t
            ease=.010+.006*math.sin(math.pi*t)**2
            r=radius(z,a)+ease
            vertices.append((r*math.sin(a),-r*math.cos(a),z))
    polygons=[]
    for i in range(rows):
        for j in range(cols):
            k=i*(cols+1)+j
            polygons.append((k,k+cols+1,k+cols+2,k+1))
    mesh=bpy.data.meshes.new('Somangi tailored continuous pattern')
    mesh.from_pydata(vertices,[],polygons);mesh.update()
    ob=bpy.data.objects.new('Somangi_TailoredVest',mesh)
    bpy.context.scene.collection.objects.link(ob)
    mat=bpy.data.materials.new('Soft olive cloth')
    mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    srgb=np.array([.72,.62,.46])
    linear=((srgb+.055)/1.055)**2.4
    shader.inputs['Base Color'].default_value=(*linear,1)
    shader.inputs['Roughness'].default_value=.82
    image=bpy.data.images.new('Vest_BaseColor',width=512,height=512)
    image.pixels.foreach_set([.72,.62,.46,1.0]*(512*512))
    image.filepath_raw=str(folder/'vest-basecolor.png');image.file_format='PNG';image.save()
    image.pack()
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image
    mat.node_tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
    uv=mesh.uv_layers.new(name='VestUV')
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            index=mesh.loops[loop_index].vertex_index
            uv.data[loop_index].uv=(index%(cols+1)/cols,1-index//(cols+1)/rows)
    mesh.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    ob.vertex_groups.new(name='Body').add(list(range(len(vertices))),1,'REPLACE')
    ob.parent=rig;ob.modifiers.new('Follow body','ARMATURE').object=rig
    solid=ob.modifiers.new('Thin cloth edge','SOLIDIFY');solid.thickness=.006;solid.offset=1
    bevel=ob.modifiers.new('Soft edge','BEVEL');bevel.width=.0025;bevel.segments=3
    # One small, continuous binding follows the entire pattern boundary.
    boundary=list(range(cols+1))
    boundary += [i*(cols+1)+cols for i in range(1,rows+1)]
    boundary += [rows*(cols+1)+j for j in range(cols-1,-1,-1)]
    boundary += [i*(cols+1) for i in range(rows-1,0,-1)]
    curve=bpy.data.curves.new('Fine fabric binding','CURVE')
    curve.dimensions='3D';curve.bevel_depth=.003;curve.bevel_resolution=3
    spline=curve.splines.new('POLY');spline.points.add(len(boundary)-1)
    for point,k in zip(spline.points,boundary):
        v=Vector(vertices[k]);radial=Vector((v.x,v.y,0)).normalized()
        point.co=(*(v+radial*.006),1)
    spline.use_cyclic_u=True
    trim=bpy.data.objects.new('Somangi_FineBinding',curve)
    bpy.context.scene.collection.objects.link(trim);curve.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT');trim.select_set(True)
    bpy.context.view_layer.objects.active=trim;bpy.ops.object.convert(target='MESH')
    trim=bpy.context.object
    trim.vertex_groups.new(name='Body').add(list(range(len(trim.data.vertices))),1,'REPLACE')
    trim.parent=rig;trim.modifiers.new('Follow body','ARMATURE').object=rig
    (folder/'design-check.json').write_text(json.dumps(dict(
        newDesign=True,reference='Somangi current body; open V neck and curved hem',
        originalAssetReused=False,clothThickness=.006,bindingRadius=.003,
        minimumEnvelopeEase=.010,maximumEnvelopeEase=.016,
        vertices=len(vertices),continuousFrontShouldersBack=True),indent=2))
    return [ob,trim]
