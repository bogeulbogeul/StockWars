"""Empty bank shell using the shared rectangular room structure."""
import bpy
import bmesh
import sys
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import material, box, finish, extrude, arch_outline, arch_ring

bpy.ops.wm.read_factory_settings(use_empty=True)
cream = material('Bank_Cream_Plaster', (.84,.74,.56))
wood = material('Bank_Light_Honey_Wood', (.32,.155,.055))
panel = material('Bank_Wood_Wainscot', (.39,.205,.085))
sage = material('Bank_Sage_Pillar_Inset', (.32,.155,.055))
floor_mats = [material('Bank_Tile_'+str(i), c) for i,c in enumerate([
    (.69,.56,.39),(.72,.59,.43),(.70,.57,.405),(.73,.605,.45)])]
base = material('Bank_Floor_Edge', (.32,.155,.055))
W,D,H,T = 8,6,2.8,.14
box('Rectangular_Floor_Base', (W+2*T,D+2*T,.14), (0,0,-.07), base,.008)
# Large regular matte tiles, supported by a continuous foundation.
for row in range(8):
    for col in range(10):
        box('Floor_Tile',(.794,.744,.024),
            (-3.6+col*.8,-2.625+row*.75,.012),floor_mats[(row+col)%4],.002)

# Axis-aligned planes meet at x=+/-4,y=3 with no diagonal corner faces.
back=box('Back_Wall', (W+2*T,T,H), (0,D/2+T/2,H/2),cream,0)
sides=[]
def continuous_trim(name, depth, bottom, height, mat, bevel):
    # A single U-shaped solid wraps both rear corners in front of the posts.
    path=[(-4,-3),(-4,3),(4,3),(4,-3),
          (4-depth,-3),(4-depth,3-depth),(-4+depth,3-depth),(-4+depth,-3)]
    vertices=[(x,y,z) for z in [bottom,bottom+height] for x,y in path]
    faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]
    faces += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj,mat,bevel)

continuous_trim('Continuous_Wainscot',.20,0,.65,panel,.003)
continuous_trim('Continuous_Wainscot_Rail',.24,.625,.07,wood,.008)
continuous_trim('Continuous_Skirting',.22,0,.09,wood,.005)
# Trim segments share flush butt joints rather than stacked corner overlaps.
box('Back_Top_Trim', (W+2*T,.22,.12), (0,D/2+T/2,H-.02),wood,.008)
for sign in [-1,1]:
    x=sign*(W/2+T/2)
    sides.append(box('Side_Wall', (T,D,H), (x,0,H/2),cream,0))
    box('Side_Top_Trim', (.22,D,.12), (x,-.04,H-.02),wood,.008)
    for y in [-D/2+.04,D/2-.04]:
        px=sign*(W/2-.07)
        box('Corner_Pillar_Shaft', (.20,.20,H-.22), (px,y,H/2-.04),wood,.008)
        box('Corner_Pillar_Wood_Foot', (.27,.27,.23), (px,y,.115),wood,.008)
        box('Corner_Pillar_Capital', (.29,.29,.15), (px,y,H-.12),wood,.008)
        box('Corner_Pillar_Cap', (.42,.42,.09), (px,y,H+.005),wood,.008)
        if y<0:
            box('Front_Pillar_Sage_Inset', (.135,.018,H-.54), (px,y-.109,H/2),sage,.006)
# Simple narrow exit, its first edge is coplanar with the room floor.
exit_mat=material('Exit_Gray_Fade',(.24,.23,.21))
nodes=exit_mat.node_tree.nodes
links=exit_mat.node_tree.links
coord=nodes.new('ShaderNodeTexCoord')
split=nodes.new('ShaderNodeSeparateXYZ')
fade=nodes.new('ShaderNodeValToRGB')
fade.color_ramp.elements[0].color=(.001,.001,.001,1)
fade.color_ramp.elements[1].color=(.44,.42,.38,1)
links.new(coord.outputs['Generated'],split.inputs[0])
links.new(split.outputs['Y'],fade.inputs[0])
links.new(fade.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])
mesh=bpy.data.meshes.new('Central_Exit_Mesh')
mesh.from_pydata([(-.5,-3.14,.022),(.5,-3.14,.022),(.5,-4.1,-.25),(-.5,-4.1,-.25)],[],[(0,3,2,1)])
exit_obj=bpy.data.objects.new('Central_Exit',mesh)
bpy.context.collection.objects.link(exit_obj)
mesh.materials.append(exit_mat)

# Low front timber edge leaves the shared central exit unobstructed.
for sign in [-1,1]:
    box('Front_Low_Border',(3.3,.16,.17),(sign*2.35,-3.06,.085),wood,.008)
# Shallow aligned wainscot panels; no loose furniture or wall decoration.
for x in [-3.7+i*.38 for i in range(20)]:
    box('Back_Wainscot_Panel',(.35,.018,.47),(x,2.787,.32),panel,.008)
for side in [-1,1]:
    for i in range(15):
        box('Side_Wainscot_Panel',(.018,.35,.47),
            (side*3.787,-2.70+i*.38,.32),panel,.008)

asset=list(bpy.context.scene.objects)
assert all(abs(back.rotation_euler[i])<1e-8 for i in range(3))
for side in sides:
    assert abs(abs(side.location.x)-T/2-W/2)<1e-6
    assert abs(side.location.y)<1e-8
    assert all(abs(a)<1e-8 for a in side.rotation_euler)
assert all(math.isfinite(c) for o in asset if o.type=='MESH' for v in o.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-room-shell.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1000
scene.world=bpy.data.worlds.new('Black')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=0
for loc,power,size in [((0,-4,9),1400,8),((0,2,7),700,6)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object
    lamp.data.energy=power
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-12,9))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PERSP'
cam.data.lens=38
scene.camera=cam
scene.render.filepath=str(ROOT/'front.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-room-shell.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'Empty native 3D shell; game integration pending',
    'dimensions':[W,D,H], 'units':'temporary modeling units',
    'interior_wall_angles_degrees':[90,90,90,90],
    'validation':{'axis_aligned_perpendicular_walls':True,'finite_vertices':True,
                  'asset_export_excludes_cameras_and_lights':True},
    'features':['cream walls','regular warm beige tiled floor','wood wainscot','four capped corner pillars',
                'matching timber front pillar insets','top cornice','central exit'],
    'furniture':False,'windows':'not cut at shell stage',
    'front_and_ceiling':'open cutaway'},indent=2),encoding='utf-8')

