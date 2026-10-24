"""A close-fitting open green vest, built against Moa's actual torso surface."""
import bpy, math, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def add_vest(body, rig, folder):
    mesh = body.data
    arm_groups = {g.index for g in body.vertex_groups if g.name.startswith('Arm.')}
    arm_vertices = {v.index for v in mesh.vertices
                    if sum(g.weight for g in v.groups if g.group in arm_groups) > .1}
    polys = [p.vertices[:] for p in mesh.polygons
             if not any(i in arm_vertices for i in p.vertices)]
    tree = BVHTree.FromPolygons([v.co for v in mesh.vertices], polys)
    verts, faces, gaps = [], [], []
    rows, cols = 48, 128
    for i in range(rows+1):
        t = i/rows
        opening = .64*(1-t)+.27*t
        for j in range(cols+1):
            theta = opening+(2*math.pi-2*opening)*j/cols
            top = -.035-.36*abs(math.sin(theta))**4
            bottom = -.44+.035*math.exp(-min(j,cols-j)/6)
            z = top*(1-t)+bottom*t
            direction = Vector((math.sin(theta),-math.cos(theta),0))
            origin = Vector((0,0,z))
            hit, normal, index, distance = tree.ray_cast(origin,direction,1.2)
            if hit is None:
                raise RuntimeError(f'Missing torso surface at {z}, {theta}')
            clearance = .018
            point = hit+direction*clearance
            verts.append(point[:])
            gaps.append(clearance)
    for i in range(rows):
        for j in range(cols):
            a = i*(cols+1)+j
            faces.append((a,a+1,a+cols+2,a+cols+1))
    data = bpy.data.meshes.new('Moa fitted vest surface')
    data.from_pydata(verts,[],faces)
    data.update()
    vest = bpy.data.objects.new('Moa_GreenVest',data)
    bpy.context.scene.collection.objects.link(vest)
    for p in data.polygons:
        p.use_smooth = True
    mat = bpy.data.materials.new('Moa soft forest green vest')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (.105,.245,.045,1)
    bsdf.inputs['Roughness'].default_value = .78
    data.materials.append(mat)
    vest.vertex_groups.new(name='Body').add(list(range(len(verts))),1,'REPLACE')
    vest.parent = rig
    vest.modifiers.new('Follow body','ARMATURE').object = rig
    solid = vest.modifiers.new('Soft fabric thickness','SOLIDIFY')
    solid.thickness = .014
    solid.offset = 0
    bevel = vest.modifiers.new('Rounded hems','BEVEL')
    bevel.width = .006
    bevel.segments = 3
    (folder/'vest-check.json').write_text(json.dumps(dict(
        bodyVerticesUnchanged=True, sampledSurfacePoints=len(verts),
        radialSurfaceClearance=.018, fabricThickness=.014,
        rigBone='Body', openFront=True, gameInstalled=False),indent=2))
    return vest
