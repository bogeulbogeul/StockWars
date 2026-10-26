import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,ratio,bake_shapes
from mouth import replace_mouth
from merge_clip import merge_clip
from torso_surface import rebuild
SOURCE=P.parent/'somangi-eat-drink-grip-v3'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'somangi-bread.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody']
root=bpy.data.objects['bread_Prop'];rig=bpy.data.objects['Somangi_OriginalRig']
base=np.array([tuple(v.co) for v in body.data.vertices]);n=len(base)
meta=json.loads((SOURCE/'bread-metadata.json').read_text());palms=meta['palmVertexIds']
legs={body.vertex_groups['Part.Leg.'+s].index for s in ['L','R']}
leg_ids=[v.index for v in body.data.vertices if any(g.group in legs for g in v.groups)]
scale=root.scale.copy();source=[];traces=[]
for frame in range(1,92):
    scene.frame_set(frame);source.append(points(body));traces.append((root.location.copy(),root.rotation_quaternion.copy()))
root.animation_data_clear();cache=[]
new_base,torso_report=rebuild(body,base)
root_ids=torso_report.pop('rootIds')
maximum=0;grip_error=0
for i,coords in enumerate(source):
    loc,q=traces[i];new_scale=scale*ratio(i/30)
    corrected=np.concatenate([coords,new_base[n:]],axis=0)
    corrected[leg_ids]=base[leg_ids]
    palm=[Vector(coords[palms[side]].mean(0)) for side in ['L','R']]
    midpoint=(palm[0]+palm[1])*.5;span=(palm[0]-palm[1]).length*.5
    local=q.inverted()@(midpoint-loc);rx=.20*new_scale.x;ry=.105*new_scale.y;rz=.17*new_scale.z
    # Let the loaf settle between the unchanged hands as its entire size decreases.
    depth=rz*max(0,1-(span/rx)**2-(local.y/ry)**2)**.5
    new_loc=midpoint-q@Vector((local.x,local.y,-depth))
    for hand in palm:
        v=q.inverted()@(hand-new_loc)
        radial=((v.x/rx)**2+(v.y/ry)**2+(v.z/rz)**2)**.5
        grip_error=max(grip_error,abs(radial-1)*max(rx,ry,rz))
    maximum=max(maximum,float(np.max(np.abs(corrected[:n]-coords))))
    cache.append(corrected);frame=i+1
    root.location=new_loc;root.rotation_quaternion=q;root.scale=new_scale
    for path in ['location','rotation_quaternion','scale']:root.keyframe_insert(path,frame=frame)
base=new_base
bake_shapes(body,cache[::6],'ReferenceEat')
for layer in body.data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=1+(point.co.x-1)*6
mouth,mouth_cache,patch,patch_cache=replace_mouth(body,base,cache)
bake_shapes(mouth,mouth_cache,'Mouth');bake_shapes(patch,patch_cache,'TemporaryCover')
scene.name='Eat_Bread';scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for o in [body,rig,root,mouth,patch,*root.children]:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_morph=True,
    export_cameras=False,export_lights=False)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
(P/'validation.json').write_text(json.dumps({'reference':str(SOURCE),'sampleFrames':91,
 'maximumCorrectionFromPreviousMotion':maximum,
 'maximumPalmBreadSurfaceError':grip_error,'twoHands':True,'foodScales':[1,.95,.9,.85],
 'animatedMouth':True,'beverageIncluded':False,'gameInstalled':False,'torso':torso_report},indent=2))
print('VALIDATION',maximum,grip_error)
