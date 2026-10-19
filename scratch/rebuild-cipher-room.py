"""Reconstruct the uploaded shell with planar surfaces; never overwrite source."""
import bpy
import json
import math
import hashlib
import bmesh
import sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT = Path(args[0]) if args else Path('C:/GitHub/StockWars/output/cipher-room-repaired-v1')
SOURCE = Path(r'C:/Users/bogeu/Downloads/Meshy_AI_Blue_Trimmed_Empty_Ro_1018221403_generate.glb')
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Preserve source coordinate system, footprint and approximate architectural sizes.
W, D = 1.90039, 1.88546
CX, CY = -.000485, -.00696
FLOOR, TOP, THICK = -.312, .313, .065
DOOR_X, DOOR_W, DOOR_H = .008, .32, .425
HALF_X, HALF_Y = W / 2, D / 2
IX, IY = HALF_X - THICK, HALF_Y - THICK

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .9
    shader.inputs['Metallic'].default_value = 0
    return mat

ivory = material('Wall_Ivory', (.78, .735, .63))
trim = material('Trim_Cream', (.86, .81, .7))
blue = material('Wainscot_Blue', (.035, .115, .24))
blue_dark = material('Baseboard_Blue', (.025, .075, .145))
tile = material('Floor_Cream', (.73, .665, .55))
grout = material('Floor_Grout', (.53, .49, .42))
gray = material('Neutral_Gray', (.65, .65, .65))
parts = []

def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj

def box(name, size, location, mat, parent=None, bevel=.0015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(CX + location[0], CY + location[1], location[2]))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new('Small_edge_bevel_only', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.affect = 'EDGES'
        modifier.harden_normals = True
        normal = obj.modifiers.new('Planar_face_normals', 'WEIGHTED_NORMAL')
        normal.keep_sharp = True
        normal.weight = 50
    obj.parent = parent
    parts.append(obj)
    return obj

floor_group = group('Floor')
box('Floor_Slab', (W, D, .018), (0, 0, FLOOR - .009), grout, floor_group)
# A coplanar top surface with color-only tile joints: no corrugation or normals map.
n, gap = 8, .002
verts, faces, indices = [], [], []
xs, ys = [-HALF_X], [-HALF_Y]
for i in range(1, n):
    xs.extend([-HALF_X + W * i / n - gap / 2, -HALF_X + W * i / n + gap / 2])
    ys.extend([-HALF_Y + D * i / n - gap / 2, -HALF_Y + D * i / n + gap / 2])
xs.append(HALF_X)
ys.append(HALF_Y)
for j in range(len(ys) - 1):
    for i in range(len(xs) - 1):
        k = len(verts)
        verts.extend([(CX + xs[i], CY + ys[j], FLOOR + .0001),
                      (CX + xs[i+1], CY + ys[j], FLOOR + .0001),
                      (CX + xs[i+1], CY + ys[j+1], FLOOR + .0001),
                      (CX + xs[i], CY + ys[j+1], FLOOR + .0001)])
        faces.append((k, k+1, k+2, k+3))
        indices.append(1 if i % 2 or j % 2 else 0)
mesh = bpy.data.meshes.new('Coplanar_Floor_Grid')
mesh.from_pydata(verts, [], faces)
mesh.materials.append(tile)
mesh.materials.append(grout)
surface = bpy.data.objects.new('Floor_Flat_Tile_Surface', mesh)
bpy.context.collection.objects.link(surface)
surface.parent = floor_group
for face, index in zip(mesh.polygons, indices):
    face.material_index = index
parts.append(surface)

def wall(name, axis, fixed):
    parent = group(name)
    height = TOP - FLOOR
    size = (W, THICK, height) if axis == 'x' else (THICK, D - THICK*2, height)
    location = (0, fixed, (TOP + FLOOR)/2) if axis == 'x' else (fixed, 0, (TOP + FLOOR)/2)
    box(name + '_Plane', size, location, ivory, parent)
    return parent

back = wall('Wall_Back', 'x', HALF_Y - THICK/2)
left = wall('Wall_Left', 'y', -HALF_X + THICK/2)
right = wall('Wall_Right', 'y', HALF_X - THICK/2)
front = group('Wall_Front')
a, b = DOOR_X - DOOR_W/2, DOOR_X + DOOR_W/2
# One concave extrusion avoids visible seams where doorway sides meet lintel.
outline = [(-HALF_X,FLOOR),(a,FLOOR),(a,FLOOR+DOOR_H),
           (b,FLOOR+DOOR_H),(b,FLOOR),(HALF_X,FLOOR),(HALF_X,TOP),(-HALF_X,TOP)]
vertices = [(CX+x,CY+y,z) for y in [-HALF_Y,-HALF_Y+THICK] for x,z in outline]
polygons = [tuple(range(7,-1,-1)),tuple(range(8,16))]
polygons += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
front_mesh = bpy.data.meshes.new('Front_Continuous_Opening')
front_mesh.from_pydata(vertices,[],polygons)
bm = bmesh.new()
bm.from_mesh(front_mesh)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(front_mesh)
bm.free()
front_obj = bpy.data.objects.new('Front_Continuous_Wall',front_mesh)
bpy.context.collection.objects.link(front_obj)
front_obj.data.materials.append(ivory)
front_obj.parent = front
parts.append(front_obj)

def horizontal(name, length, axis, fixed, z, height, depth, mat, parent, center=0):
    size = (length, depth, height) if axis == 'x' else (depth, length, height)
    pos = (center, fixed, z) if axis == 'x' else (fixed, center, z)
    return box(name, size, pos, mat, parent, bevel=.001)

for name, axis, fixed, length, parent in [
    ('Back', 'x', IY-.003, W-THICK*2, back),
    ('Left', 'y', -IX+.003, D-THICK*2, left),
    ('Right', 'y', IX-.003, D-THICK*2, right)]:
    horizontal(name+'_Panel', length, axis, fixed, FLOOR+.065, .13, .012, blue, parent)
    horizontal(name+'_Panel_Cap', length, axis, fixed, FLOOR+.136, .014, .019, blue, parent)
    horizontal(name+'_Base', length, axis, fixed, FLOOR+.009, .018, .019, blue_dark, parent)
    horizontal(name+'_Cornice', length, axis, fixed, TOP-.029, .034, .021, trim, parent)
for tag, x1, x2 in [('Left', -IX, a-.023), ('Right', b+.023, IX)]:
    for part, z, height, depth, mat in [('Panel', FLOOR+.065,.13,.012,blue),
        ('Cap', FLOOR+.136,.014,.019,blue), ('Base',FLOOR+.009,.018,.019,blue_dark)]:
        horizontal('Front_'+tag+'_'+part,x2-x1,'x',-IY+.003,z,height,depth,mat,front,(x1+x2)/2)
horizontal('Front_Cornice',W-THICK*2,'x',-IY+.003,TOP-.029,.034,.021,trim,front)

# Corner trim stays separate for later near-wall hiding and editing.
for sx in [-1, 1]:
    for sy in [-1, 1]:
        parent = group(f'Corner_{sx}_{sy}')
        x, y = sx*(IX-.019), sy*(IY-.019)
        box('Pilaster_Shaft',(.044,.044,TOP-FLOOR-.10),(x,y,(TOP+FLOOR)/2),trim,parent)
        box('Pilaster_Base',(.067,.067,.068),(x,y,FLOOR+.034),trim,parent)
        box('Pilaster_Capital',(.067,.067,.057),(x,y,TOP-.0315),trim,parent)
        box('Pilaster_Base_Cap',(.073,.073,.015),(x,y,FLOOR+.0755),trim,parent)

for side, x in [('Left', a-.017), ('Right', b+.017)]:
    box('Entry_Jamb_'+side,(.034,.022,DOOR_H+.025),
        (x,-IY+.006,FLOOR+(DOOR_H+.025)/2),trim,front)
    box('Entry_Base_'+side,(.047,.034,.055),(x,-IY+.01,FLOOR+.0275),trim,front)
box('Entry_Header',(DOOR_W+.068,.022,.028),
    (DOOR_X,-IY+.006,FLOOR+DOOR_H+.014),trim,front)

# Apply modifiers before exports so the file carries the finished normals.
for obj in parts:
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.update()

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.studiolight_rotate_z = .5
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = False
scene.display.shading.background_type = 'WORLD'
scene.world.color = (.12,.12,.12)
scene.render.resolution_x, scene.render.resolution_y = 1200,1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
bpy.ops.object.camera_add(location=(2.6,-3.7,3.5))
camera = bpy.context.object
camera.rotation_euler = (Vector((0,0,-.04))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.15
scene.camera = camera
saved = {o.name:list(o.data.materials) for o in parts}
def select_parts():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
    for obj in list(bpy.data.objects):
        if obj.type == 'EMPTY': obj.select_set(True)

def export(name):
    select_parts()
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True)

export('Room-clean-colored.glb')
scene.render.filepath = str(OUT/'clean-colored.png')
bpy.ops.render.render(write_still=True)
for obj in parts:
    for i in range(len(obj.data.materials)): obj.data.materials[i] = gray
export('Room-clean-gray.glb')
scene.display.shading.color_type = 'SINGLE'
scene.display.shading.single_color = (.72,.72,.72)
scene.render.filepath = str(OUT/'clean-gray.png')
bpy.ops.render.render(write_still=True)
for obj in parts:
    for i, mat in enumerate(saved[obj.name]): obj.data.materials[i] = mat
scene.display.shading.color_type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Room-clean.blend'))
triangles = sum(len(p.vertices)-2 for obj in parts for p in obj.data.polygons)
manifest = {'source':str(SOURCE),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'method':'Planar architectural reconstruction matching source footprint; not vertex-preserving mesh smoothing.',
    'original_triangles':69042,'clean_triangles':triangles,'mesh_parts':len(parts),
    'floor_z':FLOOR,'wall_top_z':TOP,'outer_width':W,'outer_depth':D,
    'door_center_x':CX+DOOR_X,'door_width':DOOR_W,'door_height':DOOR_H,
    'floor_surface_height_range':max(v.co.z for v in surface.data.vertices)-min(v.co.z for v in surface.data.vertices),
    'status':'Local model preview only; not installed into game.',
    'notes':['Door and trim sizes approximated from source, not exact vertex transfer.',
        'Colors are new blue/ivory proposal: uploaded GLB has no color textures.',
        'Only main entry is open; no side doors or elevator added.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('REBUILD',json.dumps(manifest))
