import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT = Path(args[0]) if args else Path('C:/GitHub/StockWars/output/cipher-room-repaired-v1')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'Room-clean-colored.glb'))
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == 'MESH']
depsgraph = bpy.context.evaluated_depsgraph_get()
def ray(origin, direction):
    hit, pos, normal, index, obj, matrix = scene.ray_cast(depsgraph,Vector(origin),Vector(direction))
    return hit,pos,normal,obj

# Blender Z up: glTF round trip must keep geometry and the open doorway.
hit,pos,normal,obj = ray((.0075,-2,-.10),(0,1,0))
assert hit and pos.y > .8, ('Entry is blocked',pos,obj)
hit,pos,normal,obj = ray((.5,-2,-.10),(0,1,0))
assert hit and pos.y < -.8, ('Front wall missing',pos,obj)
floor_heights = []
for x in [-.6,-.2,.2,.6]:
    for y in [-.6,-.2,.2,.6]:
        hit,pos,normal,obj = ray((x,y,.5),(0,0,-1))
        assert hit and abs(pos.z+.3119)<.00001, ('Nonplanar floor',pos,obj)
        assert normal.z > .99999, ('Bad floor normals',normal)
        floor_heights.append(pos.z)
assert 'Wall_Front' in bpy.data.objects and 'Wall_Back' in bpy.data.objects
for origin,direction,axis,sign in [((-2,.2,-.05),(1,0,0),0,-1),
    ((2,.2,-.05),(-1,0,0),0,1),((.3,2,-.05),(0,-1,0),1,1)]:
    hit,pos,normal,obj = ray(origin,direction)
    assert hit and abs(normal[axis]-sign)<.00001, ('Wall is not planar',normal,obj)
assert all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co)
report = {'roundtrip_import':'PASS','entry_open':'PASS','front_wall_present':'PASS',
    'floor_16_rays':'PASS','floor_height_range':max(floor_heights)-min(floor_heights),
    'floor_normals':'PASS','mesh_count':len(meshes),
    'triangle_count':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)}
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('VALIDATION',json.dumps(report))

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.78,.82,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .65
scene.view_settings.view_transform = 'AgX'
scene.render.resolution_x,scene.render.resolution_y = 1200,1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
def area(name,location,power,size):
    bpy.ops.object.light_add(type='AREA',location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0,0,-.05))-light.location).to_track_quat('-Z','Y').to_euler()
area('Key',(-2,-2,4),180,4)
area('Fill',(3,1,3),100,3)
area('Top',(0,0,4),60,2)
bpy.ops.object.camera_add(location=(2.6,-3.7,3.5))
camera = bpy.context.object
camera.data.type='ORTHO'
camera.data.ortho_scale=3.15
scene.camera = camera
for name,location in [('front',(0,-4.5,3.7)),('rear',(0,4.5,3.7)),
                      ('left',(-3.4,-3.4,3.7)),('right',(3.4,-3.4,3.7))]:
    camera.location = location
    camera.rotation_euler = (Vector((0,0,-.04))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(OUT/f'clean-colored-{name}.png')
    bpy.ops.render.render(write_still=True)
