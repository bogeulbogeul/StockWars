import bpy, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'bongbong-meshy-apron-fit-v1/Bongbong-meshy-apron.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];apron=bpy.data.objects['Bongbong_Meshy_Apron']
rig.data.pose_position='REST';bpy.context.view_layer.update()
tree=BVHTree.FromObject(bpy.data.objects['Eating_Torso'],bpy.context.evaluated_depsgraph_get())
extensions=[]
# Match the provided apron using a solid coral texel in its original material.
mat=apron.data.materials[0]
image=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'base' in n.image.name.lower()) if any(n.type=='TEX_IMAGE' and n.image and 'base' in n.image.name.lower() for n in mat.node_tree.nodes) else next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
import numpy as np
pix=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(pix)
rgba=pix.reshape(image.size[1],image.size[0],4)
mask=(rgba[:,:,0]>.65)&(rgba[:,:,1]>.12)&(rgba[:,:,1]<.38)&(rgba[:,:,2]<.35)
ys,xs=np.where(mask)
assert len(xs)>0
k=len(xs)//2;uv=((float(xs[k])+.5)/image.size[0],(float(ys[k])+.5)/image.size[1])

def point(a,z):
    d=Vector((math.sin(a),-math.cos(a),0))
    hit=tree.ray_cast(Vector((0,-.01,z)),d,2)[0]
    assert hit is not None
    return tuple(hit+d*.023)

for side in [-1,1]:
    verts=[]
    # Extend the waist ties from front side binding to the original rear band.
    for i in range(41):
        t=i/40;a=side*(.88+1.67*t)
        z=-.416
        half_width=.016+.009*math.sin(math.pi*t)
        verts.extend([point(a,z+half_width),point(a,z-half_width)])
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(40)]
    data=bpy.data.meshes.new('ExtendedWaistTie');data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new('Apron_Extended_Tie_'+str(side),data);s.collection.objects.link(o)
    data.materials.append(mat)
    layer=data.uv_layers.new(name='UVMap')
    for loop in layer.data:loop.uv=uv
    for f in data.polygons:f.use_smooth=True
    sol=o.modifiers.new('Ribbon thickness','SOLIDIFY');sol.thickness=.014;sol.offset=0
    bevel=o.modifiers.new('Rounded ribbon edges','BEVEL');bevel.width=.006;bevel.segments=2
    o.parent=rig;g=o.vertex_groups.new(name='Body');g.add(list(range(len(data.vertices))),1,'REPLACE')
    arm=o.modifiers.new('Follow body','ARMATURE');arm.object=rig
    extensions.append(o)

rig.data.pose_position='POSE';s.frame_set(7)
cam=s.camera;target=Vector((0,-.01,.1))
for name,pos in [('front',(0,-6,.1)),('left',(-6,0,.1)),('right',(6,0,.1)),('back',(0,6,.1)),('three-quarter',(3,-6,1.2)),('rear-quarter',(3,6,1.0))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(0,6,.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Bongbong-long-ties.blend'))
body_names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']
def export(filename,full):
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o==rig or o==apron or o in extensions or (full and (o.name in body_names or o.name.startswith('Bud_'))):o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(P/filename),use_selection=True,export_format='GLB',export_animations=full,export_skins=True,export_cameras=False,export_lights=False)
export('Bongbong-long-ties.glb',True);export('Apron-long-ties.glb',False)
report={'source_mesh_unchanged':True,'front_and_pocket_unchanged':True,'body_unchanged':True,
        'waist_tie_extensions':2,'extension_arc_degrees_per_side':1.67*180/math.pi,
        'surface_clearance':.023,'material':'Original apron material with fixed coral UV sample',
        'validation':'Static six-angle render; full motion contact review pending'}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('TIES_EXTENDED')
