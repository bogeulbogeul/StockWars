import bpy,sys,json
from pathlib import Path
from mathutils import Matrix
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
def curves(ob):
    for layer in ob.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                yield from bag.fcurves
def constant(ob):
    for curve in curves(ob):
        for point in curve.keyframe_points:point.interpolation='CONSTANT'
for kind,clip in [('bread','Eat_Bread'),('drink','Drink_Beverage')]:
    bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3'/f'somangi-{kind}.blend'))
    body=bpy.data.objects['Somangi_SmoothBody'];before=surface_hash(body)
    rig=bpy.data.objects['Somangi_OriginalRig'];root=bpy.data.objects[kind+'_Prop']
    scene=bpy.context.scene;scene.frame_set(1)
    if kind=='bread':
        base=bpy.data.objects['Bread roll']
        base.data.transform(base.matrix_basis);base.matrix_basis=Matrix.Identity(4)
        crumb=bpy.data.materials.new('Fresh bread crumb');crumb.use_nodes=True
        shader=crumb.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value=(.85,.66,.38,1);shader.inputs['Roughness'].default_value=.92
        base.data.materials.append(crumb);stages=[base];volumes=[]
        for index,(center,radius) in enumerate([((-.065,-.025,.135),.105),((.06,-.02,.095),.12),((0,-.01,.12),.18)],1):
            stage=base.copy();stage.data=stages[-1].data.copy();stage.name=f'Bread bite stage {index}'
            bpy.context.collection.objects.link(stage);stage.parent=root
            bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32,radius=radius)
            cutter=bpy.context.object;cutter.parent=root;cutter.location=center
            cutter.data.materials.append(base.data.materials[0]);cutter.data.materials.append(crumb)
            for f in cutter.data.polygons:f.material_index=1
            mod=stage.modifiers.new('One bite','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
            bpy.context.view_layer.objects.active=stage;stage.select_set(True)
            bpy.ops.object.modifier_apply(modifier=mod.name)
            bpy.data.objects.remove(cutter,do_unlink=True)
            for f in stage.data.polygons:f.use_smooth=f.material_index==0
            stages.append(stage)
        for stage_id,stage in enumerate(stages):
            for frame in [1,36,48,57,91]:
                visible=min(3,sum(frame>=f for f in [36,48,57]))
                stage.scale=(1,1,1) if visible==stage_id else (0,0,0)
                stage.keyframe_insert('scale',frame=frame)
            constant(stage)
        for o in list(root.children):
            if o.name.startswith('Bread score'):
                initial=o.scale.copy()
                for frame,visible in [(1,True),(36,False),(91,False)]:
                    o.scale=initial if visible else (0,0,0);o.keyframe_insert('scale',frame=frame)
                constant(o)
    else:
        juice=bpy.data.objects['Juice surface']
        for frame,height in [(1,.105),(32,.105),(36,.045),(44,.045),(48,-.025),(53,-.025),(57,-.095),(91,-.095)]:
            juice.location.z=height
            radius=.064+(height+.12)/.26*(.092-.064)
            juice.scale.x=juice.scale.y=radius/.088
            juice.keyframe_insert('location',frame=frame);juice.keyframe_insert('scale',frame=frame)
        for curve in curves(juice):
            for point in curve.keyframe_points:point.interpolation='LINEAR'
    assert surface_hash(body)==before
    scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
    for o in [body,rig,root,*root.children]:o.select_set(True)
    bpy.context.view_layer.objects.active=body
    bpy.ops.wm.save_as_mainfile(filepath=str(P/f'somangi-{kind}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'),export_format='GLB',use_selection=True,
        export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
        export_cameras=False,export_lights=False,export_morph=True)
    merge_clip(P/f'somangi-{kind}.glb',clip)
    (P/f'{kind}-metadata.json').write_text(json.dumps({'characterUnchanged':True,'meshHash':before,'durationSeconds':3,
        'consumeFrames':[36,48,57],'gameInstalled':False,'reference':'https://www.youtube.com/watch?v=_grzDhus1O8'},indent=2))
