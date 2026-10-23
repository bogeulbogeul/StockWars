import bpy,numpy as np,json,sys,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
def character_hash():
    digest=hashlib.sha256()
    for name in ['Somangi_SmoothBody','Somangi_AnimatedMouth','Somangi_TemporarySmileCover']:
        ob=bpy.data.objects[name];arrays=ob.data.shape_keys.key_blocks if ob.data.shape_keys else [ob.data]
        for key in arrays:
            vertices=key.data if hasattr(key,'data') else key.vertices
            a=np.empty(len(vertices)*3,dtype=np.float32);vertices.foreach_get('co',a);digest.update(a.tobytes())
    return digest.hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-round-body-v20/somangi-eat.blend'))
original_hash=character_hash();root=bpy.data.objects['bread_Prop'];reference=[];food_reference=[]
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    reference.append((np.array(root.location),np.array(root.rotation_quaternion),np.array(root.scale)))
    food_reference.append({ob.name:np.array(ob.matrix_world) for ob in root.children_recursive if ob.type=='MESH'})
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
assert character_hash()==original_hash
root=bpy.data.objects['bread_Prop'];loc=rotation=first_bites=food_transform=0
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame))
    expected=reference[half];loc=max(loc,float(np.max(np.abs(np.array(root.location)-expected[0]))))
    rotation=max(rotation,float(np.max(np.abs(np.array(root.rotation_quaternion)-expected[1]))))
    if (frame-1)/30<1.77:
        first_bites=max(first_bites,float(np.max(np.abs(np.array(root.scale)-expected[2]))))
        for name,matrix in food_reference[half].items():
            food_transform=max(food_transform,float(np.max(np.abs(np.array(bpy.data.objects[name].matrix_world)-matrix))))
assert max(loc,rotation,first_bites)<1e-6,(loc,rotation,first_bites)
assert food_transform<1e-6,food_transform
# Verify the delivered GLB, including every bread-scoring child.
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))
for ob in [*scene.objects,*bpy.data.shape_keys]:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
root=bpy.data.objects['bread_Prop'];consumption=bpy.data.objects['Food_ThirdBiteConsumption']
maximum_scale=0;maximum_extent=0;samples=0
for half in range(181):
    frame=1+half*.5;scene.frame_set(int(frame),subframe=frame-int(frame))
    assert min(consumption.scale)>=0
    if frame<58:continue
    samples+=1;maximum_scale=max(maximum_scale,max(abs(v) for v in consumption.scale))
    for ob in root.children_recursive:
        if ob.type!='MESH':continue
        coords=np.array([tuple(ob.matrix_world@v.co) for v in ob.data.vertices])
        maximum_extent=max(maximum_extent,float(np.ptp(coords,axis=0).max()))
assert maximum_scale==0,maximum_scale
assert maximum_extent==0,maximum_extent
report={'characterGeometryHashUnchanged':True,'maximumFoodPositionDifference':loc,
 'maximumFirstTwoBitesFoodTransformDifference':food_transform,
 'maximumFoodRotationDifference':rotation,'maximumFirstTwoBitesScaleDifference':first_bites,
 'foodGoneSeconds':1.9,'foodGoneFrame':58,'exportedEmptyFoodSamples':samples,
 'maximumConsumptionScaleAfterThirdBite':maximum_scale,'maximumFoodChildExtentAfterThirdBite':maximum_extent,
 'gameInstalled':False}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
