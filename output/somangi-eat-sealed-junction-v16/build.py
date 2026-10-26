"""Add an internal overlap sleeve; retain every existing animated vertex."""
import bpy,json,sys,numpy as np
from pathlib import Path
from collections import Counter
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes
from merge_clip import merge_clip
source=P.parent/'somangi-eat-original-collar-v15'
meta=json.loads((source/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(source/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;old=body.data
count=len(old.vertices);head=set(meta['headIds'])
head_faces=[f for f in old.polygons if all(i in head for i in f.vertices)]
edges=Counter(tuple(sorted((a,b))) for f in head_faces
    for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]))
boundary=[(a,b) for f in head_faces
    for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]) if edges[tuple(sorted((a,b)))]==1]
ids=sorted({i for e in boundary for i in e});lookup={i:j for j,i in enumerate(ids)}
start=meta['torsoVertexStart'];end=meta['torsoVertexEnd']
torso_faces=[list(f.vertices) for f in old.polygons if all(start<=i<end for i in f.vertices)]
scene.frame_set(1);base=points(body)
tree=BVHTree.FromPolygons([Vector(p) for p in base],torso_faces)
lower=[]
for i in ids:
    h=base[i];direction=Vector((h[0],h[1],0)).normalized()
    hit=tree.ray_cast(Vector((0,0,-.09)),direction,1)[0]
    assert hit is not None,i
    lower.append(np.array(hit)-np.array(direction)*.004)
lower=np.array(lower);fractions=[.15,.35,.6,.82,1.]
cache=[];max_existing_error=0
for frame in range(1,92,3):
    scene.frame_set(frame);coords=points(body)
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    normals=np.array([tuple(mesh.vertices[i].normal) for i in ids]);ev.to_mesh_clear()
    upper=coords[ids];delta=lower-upper
    tangent=delta-normals*np.sum(delta*normals,axis=1)[:,None]
    tangent/=np.maximum(np.linalg.norm(tangent,axis=1)[:,None],1e-8)
    tangent*=np.linalg.norm(delta,axis=1)[:,None]*.65
    down=np.zeros_like(delta);down[:,2]=-np.linalg.norm(delta,axis=1)*.6
    rings=[]
    for t in fractions:
        rings.append((2*t**3-3*t*t+1)*upper+(t**3-2*t*t+t)*tangent
            +(-2*t**3+3*t*t)*lower+(t**3-t*t)*down)
    result=np.vstack([coords,*rings]).astype(np.float32)
    max_existing_error=max(max_existing_error,float(np.max(np.abs(result[:count]-coords))))
    cache.append(result)
vertices=cache[0];faces=[list(f.vertices) for f in old.polygons]
materials=[f.material_index for f in old.polygons]
uv=[tuple(old.uv_layers.active.data[i].uv) for f in old.polygons for i in f.loop_indices]
previous={i:i for i in ids}
for r,t in enumerate(fractions):
    current={i:count+r*len(ids)+lookup[i] for i in ids}
    for a,b in boundary:
        faces.append([previous[b],previous[a],current[a],current[b]])
        materials.append(2);uv.extend([(.5,.5)]*4)
    previous=current
data=bpy.data.meshes.new('Original surface with internal head torso overlap')
data.from_pydata(vertices,[],faces);data.update()
for material in old.materials:data.materials.append(material)
layer=data.uv_layers.new(name='UVMap')
for i,v in enumerate(uv):layer.data[i].uv=v
for face,material in zip(data.polygons,materials):face.material_index=material;face.use_smooth=True
body.shape_key_clear();body.data=data;bake_shapes(body,cache,'SealedJunctionEat')
for layer in data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=1+(point.co.x-1)*3
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
root=bpy.data.objects['bread_Prop']
for ob in [body,root,*root.children,bpy.data.objects['Somangi_OriginalRig'],
    bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta.update({'originalVertexCount':count,'seamHeadIds':ids,'seamEdges':boundary,
    'sleeveFractions':fractions,'sleeveLower':lower.tolist(),'maximumExistingVertexErrorDuringBuild':max_existing_error})
(P/'metadata.json').write_text(json.dumps(meta,indent=2))
print('UNCHANGED ORIGINAL VERTICES',count,'MAX ERROR',max_existing_error,'SHARED HEAD EDGES',len(boundary))
