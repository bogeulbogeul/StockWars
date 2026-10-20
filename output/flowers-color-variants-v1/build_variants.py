"""Three petal colorways using the unchanged approved-shape flower study."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'flowers-clean-v1/Flowers-clean.blend'
variants={
    'pink':[(.95,.49,.60),(.91,.33,.46),(.98,.65,.71)],
    'lavender':[(.63,.48,.83),(.48,.32,.68),(.78,.65,.92)],
    'sky-blue':[(.38,.70,.91),(.25,.54,.81),(.61,.82,.96)]
}
report={}
for name,colors in variants.items():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene=bpy.context.scene
    for material_name,color in zip(['Flower_Cream','Flower_Soft_Yellow','Flower_Apricot'],colors):
        m=bpy.data.materials[material_name]
        m.diffuse_color=(*color,1)
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1)
    assets=[o for o in scene.objects if o.type in ('MESH','CURVE') and o.name!='Plane']
    bpy.ops.object.select_all(action='DESELECT')
    for o in assets:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/('Flowers-'+name+'.glb')),export_format='GLB',use_selection=True)
    cam=scene.camera;cam.location=(0,-5,2);cam.data.ortho_scale=1.6
    cam.rotation_euler=(Vector((0,0,.46))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/('Flowers-'+name+'.blend')))
    report[name]={'petal_base_colors':colors,'model':'Flowers-'+name+'.glb','geometry_unchanged':True}
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 three color studies rendered; user review and game integration pending',
    'source':str(SOURCE),'variants':report,'game_modified':False},indent=2),encoding='utf-8')
