import bpy,numpy as np,sys,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def points(body):
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    arr=np.array([tuple(v.co) for v in mesh.vertices]);ev.to_mesh_clear();return arr
def morph_hash(body):
    digest=hashlib.sha256()
    for key in body.data.shape_keys.key_blocks:
        arr=np.empty(len(key.data)*3,dtype=np.float32);key.data.foreach_get('co',arr);digest.update(arr.tobytes())
    return digest.hexdigest()
for kind,clip in [('bread','Eat_Bread'),('drink','Drink_Beverage')]:
    bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-shoulder-v2'/f'somangi-{kind}.blend'))
    body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig'];root=bpy.data.objects[kind+'_Prop']
    before=surface_hash(body);before_morph=morph_hash(body)
    scene=bpy.context.scene;scene.frame_set(41);coords=points(body)
    patches={};wrists={}
    for side,sign in [('L',1),('R',-1)]:
        bone=rig.data.bones['Arm.'+side];direction=(bone.tail_local-bone.head_local).normalized()
        group=body.vertex_groups['Part.Arm.'+side].index
        arm=[v.index for v in body.data.vertices if any(g.group==group for g in v.groups)]
        distal=[i for i in arm if (body.data.vertices[i].co-bone.head_local).dot(direction)>.30]
        wrists[side]=[i for i in arm if .16<(body.data.vertices[i].co-bone.head_local).dot(direction)<.21]
        score=-sign*coords[distal,0]+.7*coords[distal,2]-.3*coords[distal,1]
        threshold=np.quantile(score,.95)
        patches[side]=[i for i,s in zip(distal,score) if s>=threshold]
    ink=next(i for i,m in enumerate(body.data.materials) if m.name.startswith('Face_ink'))
    mouth=[]
    for face in body.data.polygons:
        center=sum((body.data.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
        if face.material_index==ink and abs(center.x)<.08 and center.z>.1 and center.y<0:mouth.extend(face.vertices)
    mouth=sorted(set(mouth))
    palm={s:Vector(coords[ids].mean(0)) for s,ids in patches.items()}
    if kind=='bread':
        midpoint=(palm['L']+palm['R'])*.5
        span=(palm['L']-palm['R']).length*.5
        rx=span/(1-(.13/.24)**2-(.02/.105)**2)**.5+.008
        fixed_scale=Vector((rx/.20,1,.24/.17))
    else:
        anchor=Vector((-.073,0,-.135));rim=Vector((.025,-.095,.14))
        mouth_peak=Vector(coords[mouth].mean(0))
        size=(mouth_peak-palm['R']).length/(rim-anchor).length
        fixed_scale=Vector((size,size,size))
    root.animation_data_clear();root.rotation_mode='QUATERNION'
    for frame in range(1,92):
        scene.frame_set(frame);coords=points(body)
        palm={s:Vector(coords[ids].mean(0)) for s,ids in patches.items()}
        lift=ease(((frame-1)/30-.35)/.55)*(1-ease(((frame-1)/30-2.05)/.55))
        if kind=='bread':
            x=(palm['L']-palm['R']).normalized()
            forward=sum((palm[s]-Vector(coords[wrists[s]].mean(0)) for s in ['L','R']),Vector())
            y=-forward;y=(y-x*y.dot(x)).normalized();z=x.cross(y).normalized();y=z.cross(x).normalized()
            root.rotation_quaternion=Matrix((x,y,z)).transposed().to_quaternion()
            root.location=(palm['L']+palm['R'])*.5+z*.13-y*.02
        else:
            aim=Vector(coords[mouth].mean(0))-palm['R']
            aimed=(rim-anchor).rotation_difference(aim)
            q=Quaternion((1,0,0,0)).slerp(aimed,lift)
            root.rotation_quaternion=q
            root.location=palm['R']-q@(anchor*fixed_scale.x)
        root.scale=fixed_scale
        root.keyframe_insert('location',frame=frame);root.keyframe_insert('rotation_quaternion',frame=frame);root.keyframe_insert('scale',frame=frame)
    assert surface_hash(body)==before and morph_hash(body)==before_morph
    scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
    for o in [body,rig,root,*root.children]:o.select_set(True)
    bpy.context.view_layer.objects.active=body
    bpy.ops.wm.save_as_mainfile(filepath=str(P/f'somangi-{kind}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'),export_format='GLB',use_selection=True,
        export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
        export_cameras=False,export_lights=False,export_morph=True)
    merge_clip(P/f'somangi-{kind}.glb',clip)
    meta={'meshAndUvUnchanged':True,'allCharacterMorphCoordinatesUnchanged':True,'meshHash':before,'morphHash':before_morph,
        'palmVertexIds':patches,'propScale':list(fixed_scale),'durationSeconds':3,'gameInstalled':False}
    if kind=='drink':meta['cupGripAnchor']=list(anchor)
    (P/f'{kind}-metadata.json').write_text(json.dumps(meta,indent=2));print(kind,'GRIP_FIXED',list(fixed_scale))
