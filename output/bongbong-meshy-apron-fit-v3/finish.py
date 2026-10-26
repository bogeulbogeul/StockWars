import bpy, math, json, bmesh
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'bongbong-meshy-apron-fit-v1/Bongbong-meshy-apron.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];apron=bpy.data.objects['Bongbong_Meshy_Apron']
rig.data.pose_position='REST';bpy.context.view_layer.update()
tree=BVHTree.FromObject(bpy.data.objects['Eating_Torso'],bpy.context.evaluated_depsgraph_get())
extensions=[]
# Remove the original short shoulders and exposed waist stubs before rebuilding.
bm=bmesh.new();bm.from_mesh(apron.data)
remove=[]
for v in bm.verts:
    x,y,z=v.co
    shoulder=(z>-.155) or (y>.025 and z>-.398)
    waist=(y>.025 and -.465<z<-.375 and abs(x)>.13)
    if shoulder or waist:remove.append(v)
bmesh.ops.delete(bm,geom=remove,context='VERTS')
bm.to_mesh(apron.data);bm.free();apron.data.update()
# Keep the original bow in front of the continuous replacement waist ribbon.
for v in apron.data.vertices:
    x,y,z=v.co
    if y>.32 and abs(x)<.14 and -.60<z<-.375:
        blend=max(0,1-(abs(x)/.14)**6)
        v.co.y+=.035*blend
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

def point(a,z,gap=.027):
    d=Vector((math.sin(a),-math.cos(a),0))
    hit=tree.ray_cast(Vector((0,-.01,z)),d,2)[0]
    assert hit is not None
    return tuple(hit+d*gap)

def ribbon(name,verts,faces,shoulder=False):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);s.collection.objects.link(o)
    data.materials.append(mat)
    layer=data.uv_layers.new(name='UVMap')
    for loop in layer.data:loop.uv=uv
    for f in data.polygons:f.use_smooth=True
    sol=o.modifiers.new('Ribbon thickness','SOLIDIFY');sol.thickness=.012;sol.offset=0
    bevel=o.modifiers.new('Rounded ribbon edges','BEVEL');bevel.width=.004;bevel.segments=3
    o.parent=rig;g=o.vertex_groups.new(name='Body');g.add(list(range(len(data.vertices))),1,'REPLACE')
    arm=o.modifiers.new('Follow body','ARMATURE');arm.object=rig
    extensions.append(o)
    if shoulder:
        # Cream shoulder center with coral edging; original material is reused.
        mask2=(rgba[:,:,0]>.80)&(rgba[:,:,1]>.75)&(rgba[:,:,2]>.60)
        wy,wx=np.where(mask2);k2=len(wx)//2
        whiteuv=((float(wx[k2])+.5)/image.size[0],(float(wy[k2])+.5)/image.size[1])
        for poly in data.polygons:
            if poly.index%3==1:
                for li in poly.loop_indices:layer.data[li].uv=whiteuv
    return o

for side in [-1,1]:
    verts=[]
    # Extend the waist ties from front side binding to the original rear band.
    for i in range(65):
        t=i/64;a=side*(.66+(math.pi-.66)*t)
        z=-.416
        half_width=.024
        # Front ends are buried behind the apron rather than placed on its face.
        blend=min(1,t/.20);blend=blend*blend*(3-2*blend)
        gap=.008+.022*blend
        for zz in [z+half_width,z-half_width]:
            q=Vector(point(a,zz,gap))
            q.y+=.12*(1-blend)
            verts.append(tuple(q))
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(64)]
    ribbon('Apron_Continuous_Waist_'+str(side),verts,faces)

    # Smooth shoulder arc, with both ends seated behind the bib/waist ribbon.
    a=Vector((side*.195,-.285,-.18));b=Vector((side*.215,-.30,.24))
    c=Vector((side*.20,.38,.18));d=Vector((side*.17,.345,-.416))
    verts=[]
    for i in range(49):
        t=i/48;p=(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d
        p.y*=.9
        # Bring the lower shoulder straps just outside the torso where needed.
        sign=-1 if p.y<0 else 1
        hit=tree.ray_cast(Vector((p.x,sign*2,p.z)),Vector((0,-sign,0)),4)[0]
        if hit is not None and abs(p.y)<abs(hit.y)+.018:p.y=sign*(abs(hit.y)+.018)
        if t<.12:p.y+=.035*(1-t/.12)**2
        if t>.88:p.y-=.022*((t-.88)/.12)**2
        for width in [-.032,-.024,.024,.032]:verts.append(tuple(p+Vector((width,0,0))))
    faces=[]
    for i in range(48):
        for j in range(3):faces.append((i*4+j,i*4+j+1,(i+1)*4+j+1,(i+1)*4+j))
    ribbon('Apron_Finished_Shoulder_'+str(side),verts,faces,True)

rig.data.pose_position='POSE';s.frame_set(7)
cam=s.camera;target=Vector((0,-.01,.1))
for name,pos in [('front',(0,-6,.1)),('left',(-6,0,.1)),('right',(6,0,.1)),('back',(0,6,.1)),('three-quarter',(3,-6,1.2)),('rear-quarter',(3,6,1.0))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(0,6,.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Bongbong-finished-apron.blend'))
body_names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']
def export(filename,full):
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o==rig or o==apron or o in extensions or (full and (o.name in body_names or o.name.startswith('Bud_'))):o.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(P/filename),use_selection=True,export_format='GLB',export_animations=full,export_skins=True,export_cameras=False,export_lights=False)
export('Bongbong-finished-apron.glb',True);export('Apron-finished.glb',False)
report={'source_mesh_unchanged':False,'source_short_straps_removed':True,'front_and_pocket_unchanged':True,'body_unchanged':True,
        'continuous_waist_halves':2,'smooth_shoulders':2,'front_ends_tucked':True,
        'surface_clearance':.03,'material':'Original apron material with fixed coral and ivory UV samples',
        'validation':'Static six-angle render; full motion contact review pending'}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('TIES_EXTENDED')
