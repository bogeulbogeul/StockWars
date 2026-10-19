import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Quaternion
from mathutils.kdtree import KDTree

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'source.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
mesh.name='MarshmallowFriend_Textured'
original=[tuple(v.co) for v in mesh.data.vertices]
faces=[tuple(p.vertices) for p in mesh.data.polygons]
# Analyze physical connectivity without changing UV seam vertices or topology.
vs=mesh.data.vertices; parent=list(range(len(vs)))
def find(i):
    while parent[i]!=i:
        parent[i]=parent[parent[i]]; i=parent[i]
    return i
def union(a,b):
    a,b=find(a),find(b)
    if a!=b: parent[b]=a
kd=KDTree(len(vs))
for v in vs: kd.insert(v.co,v.index)
kd.balance()
for edge in mesh.data.edges: union(*edge.vertices)
for v in vs:
    for _,i,_ in kd.find_range(v.co, .00002): union(v.index,i)
counts={}
for v in vs:
    i=find(v.index); counts[i]=counts.get(i,0)+1

bpy.ops.object.select_all(action='DESELECT')
data=bpy.data.armatures.new('MarshmallowFriend_Skeleton')
rig=bpy.data.objects.new('MarshmallowFriend_Rig',data)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
spec={
 'Root':((0,0,-.95),(0,0,-.78),None),
 'Body':((0,0,-.72),(0,0,-.20),'Root'),
 'Head':((0,0,-.12),(0,0,.65),'Body'),
 'Arm.L':((.34,0,-.20),(.55,0,-.53),'Body'),
 'Arm.R':((-.34,0,-.20),(-.55,0,-.53),'Body'),
 'Foot.L':((.22,0,-.76),(.22,-.18,-.9),'Root'),
 'Foot.R':((-.22,0,-.76),(-.22,-.18,-.9),'Root')}
for name,(head,tail,par) in spec.items():
    b=data.edit_bones.new(name); b.head=head; b.tail=tail
    if par: b.parent=data.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front=True; data.display_type='OCTAHEDRAL'
data.bones['Root'].use_deform=False
groups={name:mesh.vertex_groups.new(name=name) for name in spec if name!='Root'}
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)))
    return t*t*(3-2*t)
for v in vs:
    x,y,z=v.co; ax=abs(x); side='L' if x>=0 else 'R'
    head=smooth(-.18,-.095,z)
    # The arm/body cleft slopes outwards as the teardrop arm descends.
    boundary=.335+max(0,-z-.20)*.38
    arm=smooth(boundary-.035,boundary+.045,ax)*(1-smooth(-.24,-.14,z))
    arm*=smooth(-.69,-.60,z)
    foot=1-smooth(-.86,-.69,z)
    weights={'Head':head,'Arm.'+side:(1-head)*arm}
    remainder=(1-head)*(1-arm)
    left=smooth(-.11,.11,x)
    weights['Foot.L']=remainder*foot*left
    weights['Foot.R']=remainder*foot*(1-left)
    weights['Body']=remainder*(1-foot)
    for name,w in weights.items():
        if w>1e-8: groups[name].add([v.index],w,'REPLACE')
# Smooth weights along the welded surface rather than across the arm/body air gap.
import numpy as np
keys={}; mapping=[]
for v in vs:
    key=tuple(round(c,5) for c in v.co)
    if key not in keys: keys[key]=len(keys)
    mapping.append(keys[key])
mapping=np.array(mapping); names=list(groups)
W=np.zeros((len(keys),len(names)),dtype=np.float64); count=np.zeros(len(keys))
for v in vs:
    k=mapping[v.index]; count[k]+=1
    for g in v.groups: W[k,names.index(mesh.vertex_groups[g.group].name)]+=g.weight
W/=count[:,None]
edges=np.array([(mapping[e.vertices[0]],mapping[e.vertices[1]]) for e in mesh.data.edges])
edges=np.unique(np.sort(edges,axis=1),axis=0)
a,b=edges[:,0],edges[:,1]
degree=np.bincount(np.r_[a,b],minlength=len(keys))
for _ in range(100):
    sums=np.zeros_like(W)
    np.add.at(sums,a,W[b]); np.add.at(sums,b,W[a])
    W=.65*W+.35*sums/np.maximum(1,degree)[:,None]
mesh.vertex_groups.clear(); groups={name:mesh.vertex_groups.new(name=name) for name in names}
for v in vs:
    w=W[mapping[v.index]].copy()
    if v.co.z>-.095: w[:]=0; w[names.index('Head')]=1
    w/=sum(w)
    for name,value in zip(names,w):
        if value>1e-8: groups[name].add([v.index],float(value),'REPLACE')
mod=mesh.modifiers.new('Shoulder and hip skin','ARMATURE'); mod.object=rig
mod.use_deform_preserve_volume=False
mesh.parent=rig
def reset():
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION'; p.rotation_quaternion=(1,0,0,0); p.location=(0,0,0)
def rotate(name,axis,deg):
    p=rig.pose.bones[name]; basis=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=basis.inverted()@Quaternion(axis,math.radians(deg))@basis
def pose(t):
    rotate('Arm.L',(1,0,0),-22*math.sin(t*math.tau))
    rotate('Arm.R',(1,0,0),22*math.sin(t*math.tau))
    rotate('Foot.L',(1,0,0),16*math.sin(t*math.tau))
    rotate('Foot.R',(1,0,0),-16*math.sin(t*math.tau))
def key_action(name,fn,n=25):
    rig.animation_data_create(); rig.animation_data.action=None
    a=bpy.data.actions.new(name); rig.animation_data.action=a
    for frame in range(1,n+1):
        reset(); fn((frame-1)/(n-1))
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
    a.use_fake_user=True
    return a
walk=key_action('QA_LimbSwing',pose)
shoulder=key_action('QA_ArmLift',lambda t: (rotate('Arm.L',(0,1,0),-45*math.sin(t*math.pi)),rotate('Arm.R',(0,1,0),45*math.sin(t*math.pi))))
headtest=key_action('QA_HeadTurn',lambda t: rotate('Head',(0,0,1),25*math.sin(t*math.tau)))
actions=[walk,shoulder,headtest]
s=bpy.context.scene; s.render.fps=24; s.frame_start=1; s.frame_end=25
cam=s.camera
def camera(pos):
    cam.location=pos; cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
def render(name,pos):
    camera(pos); s.render.filepath=str(P/(name+'.png')); bpy.ops.render.render(write_still=True)
rig.animation_data.action=None; reset(); bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
rest=mesh.evaluated_get(deps).to_mesh()
rest_error=max((v.co-rest.vertices[i].co).length for i,v in enumerate(vs))
mesh.evaluated_get(deps).to_mesh_clear()
report={'vertex_count':len(vs),'triangles':len(faces),'bones':list(spec),
 'physical_components_after_virtual_seam_weld':sorted(counts.values(),reverse=True),
 'rest_max_displacement':rest_error,
 'max_weight_sum_error':max(abs(sum(g.weight for g in v.groups)-1) for v in vs),
 'unweighted_vertices':sum(not v.groups for v in vs),
 'source_geometry_unchanged':original==[tuple(v.co) for v in vs] and faces==[tuple(p.vertices) for p in mesh.data.polygons],
 'qa_actions':[a.name for a in actions], 'qa_scope':'Deformation tests only, not production walk or ground-contact animation'}
render('rig-rest',(0,-6,0))
for a,name,pos in [(walk,'test-swing-front',(0,-6,0)),(walk,'test-swing-side',(6,0,0)),(shoulder,'test-arm-lift',(0,-6,0)),(headtest,'test-head-turn',(0,-6,0))]:
    rig.animation_data.action=a; s.frame_set(7 if a!=shoulder else 13)
    render(name,pos)
# Inspect the weights with flat region colors without modifying the saved material.
rig.animation_data.action=None; reset(); bpy.context.view_layer.update()
for a in actions:
    track=rig.animation_data.nla_tracks.new(); track.name=a.name
    track.strips.new(a.name,1,a); track.mute=True
for img in bpy.data.images:
    if img.source=='FILE' or img.packed_file:
        try: img.pack()
        except RuntimeError: pass
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); mesh.select_set(True)
bpy.context.view_layer.objects.active=rig
camera((3,-6,1))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'marshmallow-friend-rig.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'marshmallow-friend-rig.glb'),use_selection=True,
    export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',
    export_materials='EXPORT',export_cameras=False,export_lights=False)
(P/'rig-report.json').write_text(json.dumps(report,indent=2))
assert report['unweighted_vertices']==0
assert report['max_weight_sum_error']<1e-5
assert rest_error<1e-5
print('RIG_COMPLETE',json.dumps({k:v for k,v in report.items() if k!='physical_components_after_virtual_seam_weld'}))
