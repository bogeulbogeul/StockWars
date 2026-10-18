"""Native low-poly arched double door with separate hinge pivots and materials."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path('C:/GitHub/StockWars/output/cipher-double-door-v1')
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
R, SPRING, FRAME, GAP = .16, .265, .038, .0016
parts = []

def mat(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    shader = m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .85
    return m

blue = mat('Door_Blue', (.035,.115,.24))
groove = mat('Door_Panel_Edge', (.025,.075,.145))
cream = mat('Frame_Cream', (.86,.81,.7))
handle_mat = mat('Handle_Ivory', (.91,.845,.68))
gray = mat('Neutral_Gray', (.65,.65,.65))

def empty(name, parent=None, location=(0,0,0)):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.parent = parent
    o.location = location
    return o

root = empty('Door_Assembly')
frame_root = empty('Frame', root)
left = empty('Hinge_Left', root, (-R,0,0))
right = empty('Hinge_Right', root, (R,0,0))

def finish(obj, material, parent, bevel=.0013):
    obj.data.materials.append(material)
    obj.parent = parent
    # Mesh coordinates remain world-shaped before parenting; hinge origin is local.
    if parent == left: obj.location.x = R
    elif parent == right: obj.location.x = -R
    bpy.context.view_layer.objects.active = obj
    if bevel:
        mod = obj.modifiers.new('Rounded_Edges','BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normal = obj.modifiers.new('Weighted_Flat_Faces','WEIGHTED_NORMAL')
        normal.keep_sharp = True
        bpy.ops.object.modifier_apply(modifier=normal.name)
    parts.append(obj)
    return obj

def solid(name, contour, yfront, yback, material, parent, bevel=.0013):
    count = len(contour)
    verts = [(x,y,z) for y in [yfront,yback] for x,z in contour]
    faces = [tuple(range(count-1,-1,-1)), tuple(range(count,count*2))]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(o)
    return finish(o,material,parent,bevel)

def box(name,x,z,width,height,depth,y,material,parent,bevel=.0013):
    contour = [(x-width/2,z-height/2),(x+width/2,z-height/2),
               (x+width/2,z+height/2),(x-width/2,z+height/2)]
    return solid(name,contour,y-depth/2,y+depth/2,material,parent,bevel)

for side,parent in [(-1,left),(1,right)]:
    if side == -1:
        contour = [(-R,.002),(-GAP/2,.002)]
        start = math.acos(-GAP/(2*R))
        contour += [(R*math.cos(t),SPRING+R*math.sin(t))
                    for t in [start+(math.pi-start)*i/24 for i in range(25)]]
    else:
        contour = [(GAP/2,.002),(R,.002),(R,SPRING)]
        end = math.acos(GAP/(2*R))
        contour += [(R*math.cos(t),SPRING+R*math.sin(t))
                    for t in [end*i/24 for i in range(1,25)]]
    label = 'Left' if side == -1 else 'Right'
    solid('Leaf_'+label,contour,-.014,.014,blue,parent)
    # One clean shallow plank seam per leaf, no decorative emblem.
    box('Plank_Seam_'+label,side*.085,.185,.0012,.295,.0007,-.0145,groove,parent,.0002)
    for face in [-1,1]:
        y = face*.023
        box(f'Handle_{label}_{face}',side*.022,.206,.009,.065,.013,y,handle_mat,parent,.004)
        for z in [.183,.229]:
            box(f'Handle_Mount_{label}_{face}_{z}',side*.022,z,.006,.008,.012,
                face*.016,handle_mat,parent,.0015)

# Arch ring: coplanar front annulus, extruded through wall depth, segmented only along curve.
segments = 48
vertices = []
for y in [-.028,.043]:
    for radius in [R+.003,R+FRAME]:
        vertices.extend([(radius*math.cos(math.pi*i/segments),y,
                          SPRING+radius*math.sin(math.pi*i/segments)) for i in range(segments+1)])
n = segments+1
faces = []
for i in range(segments):
    faces.extend([(i,i+1,n+i+1,n+i),
                  (2*n+i,3*n+i,3*n+i+1,2*n+i+1),
                  (i,2*n+i,2*n+i+1,i+1),
                  (n+i,n+i+1,3*n+i+1,3*n+i)])
faces.extend([(0,n,3*n,2*n),(segments,2*n-1,4*n-1,3*n-1)])
mesh = bpy.data.meshes.new('Arch_Ring')
mesh.from_pydata(vertices,[],faces)
bm = bmesh.new(); bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(mesh); bm.free()
obj = bpy.data.objects.new('Frame_Arch',mesh)
bpy.context.collection.objects.link(obj)
finish(obj,cream,frame_root,.0014)
for side in [-1,1]:
    box('Frame_Jamb',side*(R+(FRAME+.003)/2),SPRING/2,
        FRAME-.003,SPRING,.071,.0075,cream,frame_root)
    box('Frame_Base',side*(R+FRAME/2),.028,FRAME+.013,.056,.083,.003,cream,frame_root)
    box('Frame_Spring_Cap',side*(R+FRAME/2),SPRING-.008,FRAME+.012,.019,.079,.003,cream,frame_root)

def select_asset():
    bpy.ops.object.select_all(action='DESELECT')
    for o in [root,frame_root,left,right]+parts: o.select_set(True)

def export(name):
    select_asset()
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True)

export('Door-double-blue.glb')
saved = {o.name:list(o.data.materials) for o in parts}
for o in parts:
    for i in range(len(o.data.materials)): o.data.materials[i]=gray
export('Door-double-gray.glb')
for o in parts:
    for i,m in enumerate(saved[o.name]): o.data.materials[i]=m

# Save closed state with useful named hinge pivots; no gameplay or animation assumption.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Door-double.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.8,.84,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
for location,power,size in [((-1,-1,2),35,1.8),((1,1,1.5),18,1.4)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,.2))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=.58;scene.camera=camera
for name,location in [('front',(0,-1.5,.31)),('oblique',(.75,-1.4,.65)),('rear',(-.75,1.4,.65))]:
    camera.location=location
    camera.rotation_euler=(Vector((0,0,.23))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/f'door-{name}.png')
    bpy.ops.render.render(write_still=True)
left.rotation_euler.z=-math.radians(65)
right.rotation_euler.z=math.radians(65)
bpy.context.view_layer.update()
camera.location=(.75,-1.4,.65)
camera.rotation_euler=(Vector((0,0,.23))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(OUT/'door-open-preview.png')
bpy.ops.render.render(write_still=True)
left.rotation_euler.z=0;right.rotation_euler.z=0
manifest={'status':'P0 asset built; not installed in game',
    'opening_width':R*2,'opening_height':SPRING+R,'arch_spring_height':SPRING,
    'outer_width':(R+FRAME)*2+.013,'outer_height':SPRING+R+FRAME,
    'center_gap':GAP,'front_direction_gltf':'+Z','up_axis_gltf':'+Y',
    'origin':'floor center of opening','hinges':['Hinge_Left','Hinge_Right'],
    'hinge_rotation_axis_gltf':'Y','materials':[m.name for m in [blue,groove,cream,handle_mat]],
    'mesh_parts':len(parts),'triangles':sum(len(p.vertices)-2 for o in parts for p in o.data.polygons),
    'mounting':'arched opening needed for passage; existing rectangular main entrance is unchanged',
    'notes':['No signs or door emblems','Opening preview tests hinge setup; no animation clip exported',
             'Fits room scale, but side openings and collision integration are not implemented']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('BUILT',json.dumps(manifest))
