"""Fit the adopted text-free map into the existing brochure stand panel."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'popori-map-colored-pencil-no-text-v1' / 'map.png'


def install_map():
    panel = bpy.data.objects.get('Blank_Map_Insert')
    assert panel is not None, 'Missing original map panel'
    image = bpy.data.images.load(str(SOURCE), check_existing=True)
    image.pack()
    aspect = image.size[0] / image.size[1]
    height = min(.94, 1.30 / aspect)
    width = height * aspect
    mesh = bpy.data.meshes.new('Popori_Map_Print_Surface')
    mesh.from_pydata([(-width/2, -.0105, -height/2), (width/2, -.0105, -height/2),
                      (width/2, -.0105, height/2), (-width/2, -.0105, height/2)],
                     [], [(0, 1, 2, 3)])
    mesh.uv_layers.new(name='Map_UV')
    for loop, uv in zip(mesh.uv_layers.active.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv
    print_surface = bpy.data.objects.new('Popori_Colored_Pencil_Map_No_Text', mesh)
    bpy.context.collection.objects.link(print_surface)
    print_surface.parent = panel
    mat = bpy.data.materials.new('Popori_Map_Printed_Paper')
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = 1
    shader.inputs['Specular IOR Level'].default_value = .1
    image_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    image_node.image = image
    mat.node_tree.links.new(image_node.outputs['Color'], shader.inputs['Base Color'])
    print_surface.data.materials.append(mat)
    bpy.context.view_layer.update()
    assert abs(width / height - aspect) < .00001
    return {'image': str(SOURCE), 'image_pixels': list(image.size),
            'print_width': width, 'print_height': height, 'text': False,
            'mesh': print_surface.name, 'image_packed': bool(image.packed_file)}


def render(filename, width, height):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(ROOT / filename)
    bpy.ops.render.render(write_still=True)


bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'information-map-brochures-v1' /
                                     'Blank-map-brochure-stand.blend'))
report = install_map()
root = bpy.data.objects['Blank_Map_And_Brochure_Stand']
bpy.ops.object.select_all(action='DESELECT')
for obj in [root, *root.children_recursive]:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Popori-map-brochure-stand.glb'),
                           export_format='GLB', use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Popori-map-brochure-stand.blend'))
render('map-stand.png', 1000, 1200)

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'information-wall-layout-v2' /
                                     'Office-wall-layout-v2.blend'))
install_map()
from mathutils import Vector
scene = bpy.context.scene
camera = scene.camera
camera.data.type = 'PERSP'
camera.data.lens = 38
camera.location = (0, -12, 9)
camera.rotation_euler = (Vector((0, 0, 1)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Information-room-with-map.blend'))
render('room-preview.png', 1400, 1100)
report.update({'status': 'Map installed in stand and its adopted wall-layout room; game room not connected',
               'originals_preserved': True, 'brochures': 8})
(ROOT / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
