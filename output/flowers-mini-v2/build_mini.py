"""Reuse the actual Popori flowerbed flowers for four short flower colorways."""
import bpy
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'world-tree-flowerbed-v1/WorldTree-flowerbed.blend'
palettes={
    'original':[(.97,.88,.64),(.95,.68,.24),(.82,.41,.43)],
    'pink':[(.95,.49,.60),(.91,.33,.46),(.98,.65,.71)],
    'lavender':[(.63,.48,.83),(.48,.32,.68),(.78,.65,.92)],
    'sky-blue':[(.38,.70,.91),(.25,.54,.81),(.61,.82,.96)]}
reports={}
for variant,colors in palettes.items():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene=bpy.context.scene
    # First flowerbed group is precisely the three flowers used in the reference.
    names=['Flower_Stem','Small_Leaf','Rounded_Flower_Petal','Golden_Flower_Centre']
    keep=[];groups=[]
    for index in range(3):
        group=[]
        for prefix,count in zip(names,[1,2,5,1]):
            for j in range(count):
                n=index*count+j
                name=prefix if n==0 else prefix+'.'+str(n).zfill(3)
                group.append(bpy.data.objects[name])
        groups.append(group);keep.extend(group)
    for o in list(scene.objects):
        if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
    for index,group in enumerate(groups):
        stem=next(o for o in group if o.name.startswith('Flower_Stem'))
        shift=Vector(([-.23,0,.23][index], [.015,.10,0][index],-.12))-Vector((stem.location.x,stem.location.y,0))
        # Bring plants off the ring into a compact, slightly staggered group.
        for o in group:o.location+=shift
        material=bpy.data.materials.new('Mini_'+variant+'_'+str(index));material.use_nodes=True
        material.diffuse_color=(*colors[index],1)
        shader=material.node_tree.nodes['Principled BSDF']
        shader.inputs['Base Color'].default_value=(*colors[index],1)
        shader.inputs['Roughness'].default_value=.86
        for o in group:
            if o.name.startswith('Rounded_Flower_Petal'):
                o.data.materials.clear();o.data.materials.append(material)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(ROOT/('Flowers-mini-'+variant+'.glb')),export_format='GLB',use_selection=True)
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1000;scene.render.resolution_y=850
    scene.world=bpy.data.worlds.new('Mini_Studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005))
    ground=bpy.context.object
    mat=bpy.data.materials.new('Mini_Studio_Gray');mat.diffuse_color=(.72,.74,.77,1)
    mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.72,.74,.77,1)
    ground.data.materials.append(mat)
    for loc,power,size in [((-3,-4,5),400,4),((3,2,4),200,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc)
        o=bpy.context.object;o.data.energy=power;o.data.size=size
        o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam
    cam.data.type='ORTHO';cam.data.ortho_scale=.98
    cam.location=(.65,-1.4,1.05)
    cam.rotation_euler=(Vector((0,.03,.19))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(variant+'.png'));bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/('Flowers-mini-'+variant+'.blend')))
    reports[variant]={'model':'Flowers-mini-'+variant+'.glb','petal_colors':colors}
(ROOT/'manifest.json').write_text(json.dumps({'status':'P1 revised shape and four colorways; user visual review and game integration pending',
    'source':str(SOURCE),'method':'Reuse first three actual Popori flowerbed flowers; translation and petal colors only',
    'variants':reports,'game_modified':False},indent=2),encoding='utf-8')
