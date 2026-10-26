import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from merge_clip import merge_clip
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import reset,rotate,key,surface_hash
SOURCE=P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'
def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1)
    s.inputs['Roughness'].default_value=.8
    return m
def sphere(name,loc,scale,mat,parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    o.parent=parent;return o
def props(kind):
    root=bpy.data.objects.new(kind+'_Prop',None);bpy.context.collection.objects.link(root)
    if kind=='bread':
        crust=material('Bread warm crust',(.56,.25,.065))
        score=material('Bread scoring',(.88,.61,.29))
        sphere('Bread roll',(0,0,0),(.20,.105,.17),crust,root)
        for x in [-.08,0,.08]:
            o=sphere('Bread score',(x,-.068,.13),(.014,.018,.040),score,root)
            o.rotation_euler[1]=-.35
    else:
        cup=material('Cup soft teal',(.11,.40,.43));inside=material('Cup interior',(.63,.78,.73))
        liquid=material('Juice',(.70,.31,.07))
        verts=[];faces=[];n=48
        for z,r in [(-.14,.075),(.14,.105),(.14,.092),(-.12,.064)]:
            verts.extend([(r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n),z) for i in range(n)])
        for ring in range(3):
            for i in range(n):faces.append((ring*n+i,ring*n+(i+1)%n,(ring+1)*n+(i+1)%n,(ring+1)*n+i))
        faces.append(tuple(range(3*n,4*n)));faces.append(tuple(reversed(range(n))))
        mesh=bpy.data.meshes.new('Hollow cup');mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new('Drink cup',mesh);bpy.context.collection.objects.link(o);o.parent=root
        o.data.materials.append(cup);o.data.materials.append(inside)
        for f in mesh.polygons:f.use_smooth=True;f.material_index=1 if f.index>=n else 0
        bevel=o.modifiers.new('Soft rim','BEVEL');bevel.width=.006;bevel.segments=3
        bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.088,depth=.004,location=(0,0,.105))
        o=bpy.context.object;o.name='Juice surface';o.data.materials.append(liquid);o.parent=root
    return root
def arm(rig,name,target):
    b=rig.data.bones[name];basis=b.matrix_local.to_quaternion()
    q=(b.tail_local-b.head_local).rotation_difference(Vector(target)-b.head_local)
    rig.pose.bones[name].rotation_quaternion=basis.inverted()@q@basis
def hand(rig,name):
    return rig.matrix_world@rig.pose.bones[name].tail
for kind,clip in [('bread','Eat_Bread'),('drink','Drink_Beverage')]:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    rig=bpy.data.objects['Somangi_OriginalRig'];body=bpy.data.objects['Somangi_SmoothBody']
    original=surface_hash(body);rig.animation_data_clear()
    for a in list(bpy.data.actions):bpy.data.actions.remove(a)
    reset(rig);root=props(kind)
    scene=bpy.context.scene;scene.name=clip;scene.render.fps=30;scene.frame_start=1;scene.frame_end=91
    for i in range(91):
        t=i/30
        lift=ease((t-.35)/.55)*(1-ease((t-2.05)/.55))
        active=ease((t-.95)/.15)*(1-ease((t-1.95)/.15))
        nibble=(.5-.5*math.cos(2*math.pi*(t-.95)/.40))*active
        reset(rig)
        if kind=='bread':
            for side,sign in [('L',1),('R',-1)]:
                start=Vector((sign*.27,-.28,-.32));end=Vector((sign*.28,-.32,-.16))
                arm(rig,'Arm.'+side,start.lerp(end,lift)+Vector((0,.012*nibble,-.012*nibble)))
            rotate(rig,'Head',3*lift+.8*nibble)
            bpy.context.view_layer.update()
            root.location=(hand(rig,'Arm.L')+hand(rig,'Arm.R'))*.5+Vector((0,-.095,.16+.08*lift))
            root.rotation_euler=(math.radians(-5*lift),0,0)
        else:
            start=Vector((-.27,-.28,-.32));end=Vector((-.28,-.32,-.16))
            arm(rig,'Arm.R',start.lerp(end,lift));rotate(rig,'Arm.L',-7*lift)
            rotate(rig,'Head',2*lift+.6*nibble)
            bpy.context.view_layer.update()
            root.location=hand(rig,'Arm.R')+Vector((.10+.10*lift,-.065-.03*lift,.16+.08*lift))
            root.rotation_euler=(math.radians(-22*lift-2*nibble),0,0)
        key(rig,i+1)
        root.keyframe_insert('location',frame=i+1);root.keyframe_insert('rotation_euler',frame=i+1)
    assert surface_hash(body)==original
    scene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);root.select_set(True)
    for o in root.children:o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.wm.save_as_mainfile(filepath=str(P/f'source-{kind}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'),export_format='GLB',use_selection=True,
        export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
        export_cameras=False,export_lights=False)
    merge_clip(P/f'somangi-{kind}.glb',clip)
    (P/f'{kind}-metadata.json').write_text(json.dumps({'clip':clip,'durationSeconds':3,'meshAndUvUnchanged':True,'meshHash':original,'gameInstalled':False},indent=2))
