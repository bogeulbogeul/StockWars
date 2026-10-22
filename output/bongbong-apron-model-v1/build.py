import bpy, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

P = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-walk-v4/somangi-walk.blend'))
s = bpy.context.scene
rig = bpy.data.objects['Somangi_Rig']
rig.data.pose_position = 'REST'
bpy.context.view_layer.update()
body_names = ['Somangi_Body', 'Eating_Torso', 'Rigid_Arm.L', 'Rigid_Arm.R']
original = {n: [tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in body_names}
tree = BVHTree.FromObject(bpy.data.objects['Eating_Torso'], bpy.context.evaluated_depsgraph_get())
apron, buds = [], []

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = .76
    return m

ivory = material('Apron Ivory', (.90, .81, .65))
coral = material('Apron Coral', (.95, .13, .09))
budmat = material('Flower Bud Coral', (.95, .18, .13))
# Tint the original face texture rather than replacing or repainting its features.
seen = set()
for name in body_names:
    for slot in bpy.data.objects[name].material_slots:
        old = slot.material
        if old is None or old.name in seen:
            continue
        seen.add(old.name)
        mat = old.copy()
        mat.name = old.name + '_BongbongApricot'
        for other in body_names:
            for sl in bpy.data.objects[other].material_slots:
                if sl.material == old:
                    sl.material = mat
        bs = mat.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Roughness'].default_value = .76
        if bs.inputs['Base Color'].is_linked:
            source = bs.inputs['Base Color'].links[0].from_socket
            mix = mat.node_tree.nodes.new('ShaderNodeMixRGB')
            mix.blend_type = 'MULTIPLY'
            mix.inputs[0].default_value = 1
            mix.inputs[2].default_value = (1, .57, .32, 1)
            mat.node_tree.links.new(source, mix.inputs[1])
            mat.node_tree.links.new(mix.outputs[0], bs.inputs['Base Color'])
        else:
            bs.inputs['Base Color'].default_value = (1, .57, .32, 1)

def bind(o, bone='Body', collection=apron):
    world = o.matrix_world.copy()
    o.parent = rig
    o.matrix_world = world
    g = o.vertex_groups.new(name=bone)
    g.add(list(range(len(o.data.vertices))), 1, 'REPLACE')
    mod = o.modifiers.new('Shared body rig', 'ARMATURE')
    mod.object = rig
    collection.append(o)
    return o

def mesh(name, verts, faces, mat, bone='Body', collection=apron):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    s.collection.objects.link(o)
    o.data.materials.append(mat)
    for p in data.polygons:
        p.use_smooth = True
    return bind(o, bone, collection)

def tube(name, points, radius, mat, bone='Body', collection=apron):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.resolution_u = 1
    c.bevel_depth = radius
    c.bevel_resolution = 1
    sp = c.splines.new('POLY')
    sp.points.add(len(points)-1)
    for v, co in zip(sp.points, points):
        v.co = (*co, 1)
    o = bpy.data.objects.new(name, c)
    s.collection.objects.link(o)
    o.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')
    for f in o.data.polygons:
        f.use_smooth = True
    return bind(o, bone, collection)

def front(x, z, gap=.018):
    hit = tree.ray_cast(Vector((x, -2, z)), Vector((0, 1, 0)), 4)[0]
    if hit is None:
        raise ValueError(f'Apron outside body surface: {x}, {z}')
    return (x, hit.y-gap, z)

def panel(name, rows, cols, position, mat):
    verts = [position(j/cols, i/rows) for i in range(rows+1) for j in range(cols+1)]
    faces = []
    for i in range(rows):
        for j in range(cols):
            a = i*(cols+1)+j
            faces.append((a, a+1, a+cols+2, a+cols+1))
    o = mesh(name, verts, faces, mat)
    solid = o.modifiers.new('Thin cloth shell', 'SOLIDIFY')
    solid.thickness = .009
    solid.offset = 0
    return o

def main_point(u, t):
    u = 2*u-1
    width = .205 + .105*math.sin(math.pi*t*.65)
    z = (-.07-.02*u*u)*(1-t)+(-.66+.09*u*u)*t
    return front(u*width, z)

panel('Bongbong_Apron_Front', 12, 16, main_point, ivory)
edge = [main_point(j/16, 0) for j in range(17)]
edge += [main_point(1, i/12) for i in range(1, 13)]
edge += [main_point(j/16, 1) for j in range(15, -1, -1)]
edge += [main_point(0, i/12) for i in range(11, -1, -1)]
tube('Apron_Coral_Binding', [(x, y-.004, z) for x,y,z in edge], .012, coral)

def pocket_point(u, t):
    u = 2*u-1
    z = -.31*(1-t)+(-.555+.065*u*u)*t
    return front(u*.205, z, .044+.008*math.sin(math.pi*t))

panel('Apron_Pocket', 6, 12, pocket_point, ivory)
pe = [pocket_point(j/12, 0) for j in range(13)]
pe += [pocket_point(1, i/6) for i in range(1, 7)]
pe += [pocket_point(j/12, 1) for j in range(11, -1, -1)]
pe += [pocket_point(0, i/6) for i in range(5, -1, -1)]
tube('Pocket_Coral_Edge', pe, .011, coral)

# Shoulder ribbons follow the actual body by radial ray casts.
def radial(theta, z, gap=.022):
    d = Vector((math.sin(theta), -math.cos(theta), 0))
    hit = tree.ray_cast(Vector((0, -.01, z)), d, 2)[0]
    if hit is None:
        raise ValueError('No torso surface')
    return tuple(hit+d*gap)

for side in [-1, 1]:
    # A smooth arch outside the shoulder, anchored at front bib and back waist.
    controls = [Vector(front(side*.17, -.075)), Vector((side*.21,-.13,.025)),
                Vector((side*.22,.015,.045)), Vector((side*.22,.16,-.015)),
                Vector(radial(side*2.55, -.27))]
    path=[]
    for k in range(len(controls)-1):
        for j in range(4):
            path.append(controls[k].lerp(controls[k+1],j/4))
    path.append(controls[-1])
    verts=[]
    for p in path:
        verts.extend([tuple(p+Vector((-.028,0,0))),tuple(p+Vector((.028,0,0)))])
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(path)-1)]
    o=mesh('Apron_Shoulder_'+str(side),verts,faces,ivory)
    sol=o.modifiers.new('Ribbon thickness','SOLIDIFY');sol.thickness=.012
    tube('Shoulder_Coral_'+str(side),[tuple(p+Vector((side*.028,0,0))) for p in path],.006,coral)

# Rear waist ribbon, open back. No duplicated back cloth panel.
verts=[]
for i in range(49):
    a=.85+(math.tau-1.7)*i/48
    verts.extend([radial(a,-.27),radial(a,-.32)])
mesh('Apron_Waist_Ribbon',verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(48)],coral)
back=radial(math.pi,-.295)
by=back[1]+.018
for side in [-1,1]:
    # Low-poly softly rounded ribbon loops and hanging tails.
    outline=[(0,by,-.29),(side*.11,by+.015,-.23),(side*.16,by,-.25),
             (side*.16,by,-.33),(side*.10,by+.015,-.35)]
    o=mesh('Bow_Loop_'+str(side),outline,[(0,1,2,3,4)],coral)
    sol=o.modifiers.new('Bow thickness','SOLIDIFY');sol.thickness=.024
    bev=o.modifiers.new('Soft bow edge','BEVEL');bev.width=.012;bev.segments=2
    outline=[(side*.015,by+.012,-.31),(side*.055,by+.02,-.32),
             (side*.11,by+.03,-.48),(side*.04,by+.035,-.455)]
    o=mesh('Bow_Tail_'+str(side),outline,[(0,1,2,3)],coral)
    sol=o.modifiers.new('Tail thickness','SOLIDIFY');sol.thickness=.012
    bev=o.modifiers.new('Soft tail edge','BEVEL');bev.width=.008;bev.segments=2

def sphere(name, loc, scale, mat, bone='Head', collection=buds):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return bind(o,bone,collection)

sphere('Bow_Knot',(0,by+.02,-.29),(.035,.027,.037),coral,'Body',apron)
# Flower ornament is independent of the preserved original head geometry.
sphere('Bud_Center',(0,.015,1.045),(.085,.075,.16),budmat)
for side in [-1,1]:
    o=sphere('Bud_Petal_'+str(side),(side*.085,-.035,1.005),(.072,.068,.13),budmat)
    # Rotate mesh coordinates about petal center, preserving armature coordinates.
    center=Vector((side*.085,-.035,1.005))
    from mathutils import Matrix
    rot=Matrix.Rotation(side*.55,3,'Y')
    for v in o.data.vertices:v.co=rot@v.co

rig.data.pose_position='POSE'
s.frame_set(7)
bpy.context.view_layer.update()
s.render.resolution_x=800;s.render.resolution_y=800;s.render.resolution_percentage=100
s.cycles.samples=24
cam=s.camera;cam.data.ortho_scale=2.7
target=Vector((0,-.01,.1))
for name,pos in [('front',(0,-6,.1)),('left',(-6,0,.1)),('right',(6,0,.1)),('back',(0,6,.1)),('three-quarter',(3,-6,1.2))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(0,-6,.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Bongbong-apron.blend'))
def export(path, objects, animation):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(P/path),use_selection=True,export_format='GLB',
        export_animations=animation,export_skins=True,export_cameras=False,export_lights=False)
export('Bongbong-apron.glb',[rig]+[bpy.data.objects[n] for n in body_names]+apron+buds,True)
export('Apron-only.glb',[rig]+apron,False)
dg=bpy.context.evaluated_depsgraph_get()
def triangles(objects):
    total=0
    for o in objects:
        ev=o.evaluated_get(dg);m=ev.to_mesh();m.calc_loop_triangles();total+=len(m.loop_triangles);ev.to_mesh_clear()
    return total
assert all(original[n]==[tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in body_names)
report={'body_vertex_positions_unchanged':True,'apron_triangles':triangles(apron),
        'bud_triangles':triangles(buds),'body_triangles':triangles([bpy.data.objects[n] for n in body_names]),
        'apron_separate_meshes':len(apron),'rig':'Original Somangi_Rig / Body; flower follows Head',
        'status':'Model and static render preview; not installed in game; full motion contact review pending'}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('BONGBONG_COMPLETE',json.dumps(report))
