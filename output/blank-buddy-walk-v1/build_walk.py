import bpy, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector, Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-inspect-v2/source.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
mesh.name='Somangi_Body'; original=[tuple(v.co) for v in mesh.data.vertices]
# The generated normal map contains the ghost eyes on the back of the head.
# Keep original color and roughness maps; use the original smooth mesh normals.
for mat in mesh.data.materials:
    for n in mat.node_tree.nodes:
        if n.type=='BSDF_PRINCIPLED':
            for link in list(n.inputs['Normal'].links):mat.node_tree.links.remove(link)
bpy.ops.object.select_all(action='DESELECT')
data=bpy.data.armatures.new('Somangi_Skeleton')
rig=bpy.data.objects.new('Somangi_Rig',data);bpy.context.collection.objects.link(rig)
rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
spec={
 'Root':((0,0,-.95),(0,0,-.77),None),
 'Body':((0,0,-.57),(0,0,-.05),'Root'),
 'Head':((0,0,.005),(0,0,.7),'Body'),
 'Arm.L':((.29,0,-.045),(.53,0,-.39),'Body'),
 'Arm.R':((-.29,0,-.045),(-.53,0,-.39),'Body'),
 'Leg.L':((.20,0,-.56),(.20,-.025,-.89),'Root'),
 'Leg.R':((-.20,0,-.56),(-.20,-.025,-.89),'Root')}
for name,(head,tail,par) in spec.items():
    b=data.edit_bones.new(name);b.head=head;b.tail=tail
    if par:b.parent=data.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT');data.bones['Root'].use_deform=False
rig.show_in_front=True;data.display_type='OCTAHEDRAL'
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
names=[n for n in spec if n!='Root']
vs=mesh.data.vertices; keys={};mapping=[]
for v in vs:
    key=tuple(round(c,5) for c in v.co)
    if key not in keys:keys[key]=len(keys)
    mapping.append(keys[key])
mapping=np.array(mapping);W=np.zeros((len(keys),len(names)));counts=np.zeros(len(keys))
for v in vs:
    x,y,z=v.co;ax=abs(x);side='L' if x>=0 else 'R'
    head=smooth(-.045,.04,z)
    boundary=.29+max(0,-z-.05)*.40
    arm=smooth(boundary-.03,boundary+.055,ax)*(1-smooth(-.07,.015,z))*smooth(-.54,-.46,z)
    leg=1-smooth(-.67,-.51,z);left=smooth(-.085,.085,x)
    w={'Head':head,'Arm.'+side:(1-head)*arm}
    rest=(1-head)*(1-arm)
    w.update({'Body':rest*(1-leg),'Leg.L':rest*leg*left,'Leg.R':rest*leg*(1-left)})
    k=mapping[v.index];counts[k]+=1
    for name,val in w.items():W[k,names.index(name)]+=val
W/=counts[:,None]
edges=np.unique(np.sort(np.array([(mapping[e.vertices[0]],mapping[e.vertices[1]]) for e in mesh.data.edges]),axis=1),axis=0)
a,b=edges[:,0],edges[:,1];degree=np.bincount(np.r_[a,b],minlength=len(keys))
for _ in range(65):
    sums=np.zeros_like(W);np.add.at(sums,a,W[b]);np.add.at(sums,b,W[a])
    W=.65*W+.35*sums/np.maximum(1,degree)[:,None]
groups={n:mesh.vertex_groups.new(name=n) for n in names}
for v in vs:
    w=W[mapping[v.index]].copy()
    if v.co.z>.045:w[:]=0;w[names.index('Head')]=1
    w/=w.sum()
    for n,val in zip(names,w):
        if val>1e-8:groups[n].add([v.index],float(val),'REPLACE')
mod=mesh.modifiers.new('Smooth shoulder and hip weights','ARMATURE');mod.object=rig
mesh.parent=rig
def reset():
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
def rotate(name,axis,angle):
    p=rig.pose.bones[name];q=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(angle))@q
def translate(name,xyz):
    p=rig.pose.bones[name];p.location=p.bone.matrix_local.to_3x3().inverted()@Vector(xyz)
STRIDE=.14;LIFT=.045;FPS=24;PERIOD=24
def walk(t):
    # First half is planted support, second half advances above the floor.
    for side,offset in [('L',0),('R',.5)]:
        phase=(t+offset)%1
        if phase<.5:
            y=-STRIDE/2+2*STRIDE*phase;z=0
        else:
            u=(phase-.5)*2
            y=STRIDE/2-STRIDE*(u*u*(3-2*u));z=LIFT*math.sin(math.pi*u)**2
        translate('Leg.'+side,(0,y,z))
    rotate('Arm.L',(1,0,0),9*math.cos(t*math.tau))
    rotate('Arm.R',(1,0,0),-9*math.cos(t*math.tau))
    # Tiny upper-body sway; feet stay independent of the Body bone.
    translate('Body',(.005*math.sin(t*math.tau),0,.004*(1-math.cos(t*math.tau*2))))
rig.animation_data_create();action=bpy.data.actions.new('Walk_InPlace');rig.animation_data.action=action
s=bpy.context.scene;s.render.fps=FPS;s.frame_start=1;s.frame_end=PERIOD
for frame in range(1,PERIOD+2):
    reset();walk((frame-1)/PERIOD)
    for p in rig.pose.bones:
        p.keyframe_insert('location',frame=frame,group=p.name)
        p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
action.use_fake_user=True
cam=s.camera
def camera(pos):
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
def render(name,pos):
    camera(pos);s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=None;reset();bpy.context.view_layer.update()
render('clean-front',(0,-6,0));render('clean-back',(0,6,0))
rig.animation_data.action=action;s.frame_set(8)
render('walk-front',(0,-6,0));render('walk-side',(6,0,0))
# A ground plane is preview-only and excluded from GLB export.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.951))
floor=bpy.context.object;floor.name='Preview_Ground'
mat=bpy.data.materials.new('Ground');mat.diffuse_color=(.23,.25,.27,1);mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.23,.25,.27,1);bs.inputs['Roughness'].default_value=.9
floor.data.materials.append(mat)
camera((2.8,-6,1.1));s.cycles.samples=12
s.render.resolution_x=480;s.render.resolution_y=480
(P/'frames').mkdir(exist_ok=True)
for frame in range(1,PERIOD+1):
    s.frame_set(frame);s.render.filepath=str(P/'frames'/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
s.frame_set(1);camera((2.8,-6,1.1));s.render.resolution_x=800;s.render.resolution_y=800
for img in bpy.data.images:
    if img.source=='FILE' or img.packed_file:
        try:img.pack()
        except RuntimeError:pass
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),use_selection=True,
 export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',
 export_materials='EXPORT',export_cameras=False,export_lights=False)
report={'source':'Meshy_AI_Blank_Buddy_1018082424_texture.glb','vertices':len(vs),
 'triangles':len(mesh.data.polygons),'geometry_unchanged':original==[tuple(v.co) for v in vs],
 'repair':'Disconnect generated normal map containing ghost eyes. Base color/roughness preserved; mesh smooth normals used.',
 'bones':list(spec),'unweighted_vertices':sum(not v.groups for v in vs),
 'weight_error':max(abs(sum(g.weight for g in v.groups)-1) for v in vs),
 'clip':'Walk_InPlace','fps':FPS,'period_seconds':PERIOD/FPS,'closure_keyframe':25,
 'stride_distance':STRIDE,'nominal_travel_speed':2*STRIDE,'foot_lift':LIFT,
 'forward_axis':'Blender -Y / glTF +Z','preview_ground_z':-.951}
(P/'build-report.json').write_text(json.dumps(report,indent=2))
print('WALK_BUILD_COMPLETE',json.dumps(report))
