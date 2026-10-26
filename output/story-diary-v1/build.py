"""Closed and open story diary props. Blender 5.2, native editable meshes."""
import bpy
import bmesh
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes['Principled BSDF']
    node.inputs['Base Color'].default_value = mat.diffuse_color
    node.inputs['Roughness'].default_value = .8
    return mat


def box(name, size, location, mat, bevel=.003):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft_Rounded_Edges', 'BEVEL')
        mod.width, mod.segments = bevel, 5
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:
        p.use_smooth = True
    mod = obj.modifiers.new('Weighted_Normals', 'WEIGHTED_NORMAL')
    mod.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


reports = {}
for state in ('Closed', 'Open'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sage = material('Cover_Sage_Green', (.16,.28,.17))
    spine_mat = material('Spine_Deep_Sage', (.10,.20,.12))
    paper = material('Blank_Pages_Ivory', (.89,.83,.69))
    edges = material('Page_Edge_Cream', (.72,.64,.48))
    ribbon = material('Bookmark_Warm_Beige', (.51,.31,.13))
    root = bpy.data.objects.new('StoryDiary_'+state, None)
    bpy.context.collection.objects.link(root)
    objects = []
    if state == 'Closed':
        objects += [box('Back_Cover',(.225,.302,.008),(0,0,.004),sage),
            box('Page_Block',(.208,.284,.027),(.003,0,.0215),paper,.002),
            box('Front_Cover',(.225,.302,.008),(0,0,.039),sage),
            box('Rounded_Spine',(.018,.302,.041),(-.106,0,.0205),spine_mat,.007),
            box('Blank_Cover_Label',(.105,.065,.0015),(.007,.058,.0435),paper,.006),
            box('Bookmark_Ribbon',(.013,.181,.0012),(.034,-.087,.021),ribbon,.0005)]
        # Three restrained page-edge divisions, not individual thick sheets.
        for z in (.015,.022,.029):
            objects.append(box('Page_Edge_Line',(.0006,.270,.0005),(.1072,0,z),edges,.0002))
    else:
        for side in (-1,1):
            objects += [box('Open_Cover',(.221,.302,.008),(side*.113,0,.004),sage),
                box('Open_Page_Block',(.208,.283,.015),(side*.111,0,.0155),paper,.002),
                box('Blank_Writing_Page',(.207,.282,.001),(side*.111,0,.0235),paper,.0004)]
            for z in (.013,.018):
                objects.append(box('Page_Edge_Line',(.0005,.270,.0004),(side*.215,0,z),edges,.00015))
        objects += [box('Center_Binding',(.012,.292,.018),(0,0,.013),edges,.004),
                    box('Bookmark_Ribbon',(.012,.240,.001),(0,-.049,.025),ribbon,.0004)]
    for obj in objects:
        obj.parent = root
    anchor = bpy.data.objects.new('Writing_Surface_Anchor' if state=='Open' else 'Cover_Anchor',None)
    bpy.context.collection.objects.link(anchor)
    anchor.parent=root
    anchor.location=(.11 if state=='Open' else 0,0,.025 if state=='Open' else .0445)
    bpy.ops.object.select_all(action='DESELECT')
    checks=[]
    for obj in objects:
        bm=bmesh.new()
        bm.from_mesh(obj.data)
        assert all(e.is_manifold for e in bm.edges),obj.name
        assert bm.calc_volume(signed=True)>0,obj.name
        bm.free()
        obj.data.calc_loop_triangles()
        checks.append(dict(name=obj.name,triangles=len(obj.data.loop_triangles)))
        obj.select_set(True)
    root.select_set(True)
    anchor.select_set(True)
    glb=OUT/f'StoryDiary-{state.lower()}.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True)
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    imported=list(set(bpy.context.scene.objects)-before)
    meshes=[o for o in imported if o.type=='MESH']
    assert len(meshes)==len(objects)
    points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    dims=[max(p[a] for p in points)-min(p[a] for p in points) for a in range(3)]
    for obj in imported:
        bpy.data.objects.remove(obj,do_unlink=True)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=32
    scene.cycles.use_denoising=True
    scene.render.resolution_x=1100
    scene.render.resolution_y=1000
    scene.world=bpy.data.worlds.new('Studio')
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.75,.69,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
    box('Studio_Ground',(200,200,.01),(0,0,-.0052),material('Studio_Ivory',(.78,.72,.61)),0)
    target=Vector((0,0,.02))
    for loc,power,size in [((-.8,-1,1.5),65,1.4),((1,.4,1),30,1)]:
        bpy.ops.object.light_add(type='AREA',location=loc)
        obj=bpy.context.object
        obj.data.energy,obj.data.size=power,size
        obj.rotation_euler=(target-obj.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(.45,-.68,.95))
    cam=bpy.context.object
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO'
    cam.data.ortho_scale=.47 if state=='Closed' else .60
    scene.camera=cam
    scene.render.filepath=str(OUT/f'{state.lower()}.png')
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'StoryDiary-{state.lower()}.blend'))
    reports[state]=dict(dimensions_H=dims,meshes=checks,glb_bytes=glb.stat().st_size,
        checks='Closed positive-volume meshes; independent GLB import mesh count and bounds recorded')
(OUT/'manifest.json').write_text(json.dumps(dict(variants=reports,game_installed=False,
    status='P1: standalone props produced; user visual approval and hand contact pending',
    design='Sage cover, ivory blank pages, beige bookmark; no text, dates or logo',
    scale='Provisional H=1 character-relative units; final game scale pending',
    origin='Bottom center, lying flat; Blender Z-up, heading +Y; glTF Y-up, heading -Z',
    animation='Two static props; no opening rig/animation or writing UI'),indent=2),encoding='utf-8')
print('DIARY_COMPLETE')
