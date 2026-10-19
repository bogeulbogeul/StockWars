"""Local, UV-preserving smoothing of the original Meshy puppy."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT.parent/'meshy-dog-simple-v1/dog.glb'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.render.resolution_x=800
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.world.color=(.35,.35,.35)
scene.view_settings.view_transform='Standard'
def aim(o,p):
    o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
for pos,power in [((-3,-4,5),350),((3,-2,3),220),((0,3,3),140)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    bpy.context.object.data.energy=power
    bpy.context.object.data.size=4
    aim(bpy.context.object,(0,0,0))
bpy.ops.object.camera_add(location=(0,-4,0))
camera=bpy.context.object
camera.data.type='ORTHO'
camera.data.ortho_scale=2.25
scene.camera=camera
def render(name,loc):
    camera.location=loc
    aim(camera,(0,0,0))
    scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
render('before-front',(0,-4,0))
render('before-side',(4,0,0))
render('before-back',(0,4,0))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'inspection.blend'))

# Sample the imported albedo so new face/ear surfaces match the original.
oldmat=obj.data.materials[0]
albedo=next(n.image for n in oldmat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
old_uv=obj.data.uv_layers.active
def sample_at(pos):
    target=Vector(pos)
    vi=min(range(len(obj.data.vertices)),key=lambda i:(obj.data.vertices[i].co-target).length_squared)
    li=next(l.index for l in obj.data.loops if l.vertex_index==vi)
    u,v=old_uv.data[li].uv
    w,h=albedo.size
    ix=min(w-1,max(0,int(u*w)))
    iy=min(h-1,max(0,int(v*h)))
    k=(iy*w+ix)*4
    return tuple(albedo.pixels[k:k+4])
orange=sample_at((0,-.34,.57))
cream=sample_at((.13,-.43,.22))
dark=(.055,.025,.012,1)

# Keep the original skull silhouette; replace only the front relief with a
# continuous rounded surface. The small nose remains volumetric.
changed=0
for v in obj.data.vertices:
    x,y,z=v.co
    if y<-.12 and .075<z<.73 and abs(x)<.47:
        q=1-(x/.50)**2-((z-.435)/.405)**2
        if q>0:
            target=.015-.43*math.sqrt(q)
            nose=abs(x)<.064 and .255<z<.335
            edge=min(1,max(0,(.47-abs(x))/.055),max(0,(z-.075)/.055),max(0,(.73-z)/.055))
            edge*=max(0,min(1,(1-(x/.46)**2-((z-.39)/.34)**2)*5))
            if not nose:
                v.co.y=y+(target-y)*edge
                changed+=1

def linear(c):
    return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4

def flat_material(name,color):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=tuple(linear(c) for c in color[:3])+(1,)
    bs.inputs['Roughness'].default_value=.85
    return m

earmat=flat_material('Ear repair orange',orange)
# Add volume behind the ear flaps, retaining the original visible front flaps.
for s in (-1,1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,
                                      location=(s*.345,.075,.685))
    bridge=bpy.context.object
    bridge.name='Ear rear infill'
    bridge.scale=(.145,.235,.18)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bridge.data.materials.append(earmat)
    for p in bridge.data.polygons:
        p.use_smooth=True
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bridge.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.join()

def expression_image(expression):
    pixels=[]
    for j in range(512):
        z=.02+j/511*.76
        for i in range(512):
            x=(i/511-.5)*1.02
            c=orange
            if (x/.35)**2+((z-.225)/.145)**2<1:
                c=cream
            if abs(x)<.10 and .23<z<.46 and abs(x)<(.46-z)*.50:
                c=cream
            for s in (-1,1):
                dx=x-s*.19
                dz=z-.425
                if expression=='neutral':
                    eye=(dx/.065)**2+(dz/.100)**2<1
                else:
                    eye=abs(dz-(.035 if expression=='happy' else 0)+.075*(dx/.065)**2)<.010 and abs(dx)<.065
                if eye:
                    c=dark
                if expression=='neutral' and ((dx+.017)/.019)**2+((dz-.04)/.023)**2<1:
                    c=(1,1,1,1)
                if (dx/.065)**2+((z-.605)/.025)**2<1:
                    c=cream
                if abs(math.sqrt((x-s*.048)**2+(z-.248)**2)-.048)<.009 and z<.248:
                    c=dark
            if (x/.055)**2+((z-.294)/.037)**2<1:
                c=dark
            pixels.extend(c)
    img=bpy.data.images.new('Expression '+expression,width=512,height=512,alpha=False)
    img.pixels=pixels
    img.filepath_raw=str(OUT/('face-'+expression+'.png'))
    img.file_format='PNG'
    img.save()
    img.pack()
    return img

images={e:expression_image(e) for e in ('neutral','blink','happy')}
facemat=flat_material('Face - texture expressions',orange)
tex=facemat.node_tree.nodes.new('ShaderNodeTexImage')
tex.name='EXPRESSION_IMAGE'
tex.image=images['neutral']
facemat.node_tree.links.new(tex.outputs['Color'],facemat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
obj.data.materials.append(facemat)
face_index=len(obj.data.materials)-1
uv=obj.data.uv_layers.new(name='FaceExpressions')
# Preserve original UVs everywhere else. Face uses a dedicated projected map.
for p in obj.data.polygons:
    p.use_smooth=True
    x,y,z=p.center
    if y<-.12 and .075<z<.73 and abs(x)<.47:
        p.material_index=face_index
    for li in p.loop_indices:
        v=obj.data.vertices[obj.data.loops[li].vertex_index].co
        uv.data[li].uv=(v.x/1.02+.5,(v.z-.02)/.76)
uvnode=facemat.node_tree.nodes.new('ShaderNodeUVMap')
uvnode.uv_map=uv.name
facemat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
obj.data.uv_layers.active=obj.data.uv_layers[0]
obj.data.uv_layers[0].active_render=True
obj.data.update()
# Close seams and overlapping infill surfaces, then transfer the original UVs.
donor=obj.copy()
donor.data=obj.data.copy()
bpy.context.collection.objects.link(donor)
donor.hide_render=True
original_name=donor.data.uv_layers[0].name
for layer in list(donor.data.uv_layers)[1:]:
    donor.data.uv_layers.remove(layer)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
rem=obj.modifiers.new('Weld repair surfaces','REMESH')
rem.mode='VOXEL'
rem.voxel_size=.008
bpy.ops.object.modifier_apply(modifier=rem.name)
sm=obj.modifiers.new('Smooth repair transitions','SMOOTH')
sm.factor=.7
sm.iterations=8
bpy.ops.object.modifier_apply(modifier=sm.name)
for layer in list(obj.data.uv_layers):
    obj.data.uv_layers.remove(layer)
obj.data.uv_layers.new(name=original_name)
transfer=obj.modifiers.new('Recover original UV','DATA_TRANSFER')
transfer.object=donor
transfer.use_loop_data=True
transfer.data_types_loops={'UV'}
transfer.loop_mapping='POLYINTERP_NEAREST'
bpy.ops.object.datalayout_transfer(modifier=transfer.name)
bpy.ops.object.modifier_apply(modifier=transfer.name)
bpy.data.objects.remove(donor,do_unlink=True)
newuv=obj.data.uv_layers.new(name='FaceExpressionsFinal')
uvnode.uv_map=newuv.name
for p in obj.data.polygons:
    p.use_smooth=True
    x,y,z=p.center
    p.material_index=face_index if y<-.11 and .065<z<.735 and abs(x)<.475 else 0
    for li in p.loop_indices:
        v=obj.data.vertices[obj.data.loops[li].vertex_index].co
        newuv.data[li].uv=(v.x/1.02+.5,(v.z-.02)/.76)
obj.data.uv_layers[0].active_render=True
for node in oldmat.node_tree.nodes:
    if node.type=='BSDF_PRINCIPLED':
        for link in list(node.inputs['Normal'].links):
            oldmat.node_tree.links.remove(link)
render('front',(0,-4,0))
render('side',(4,0,0))
render('back',(0,4,0))
render('chin',(0,-3,-1.5))
tex.image=images['happy']
render('happy',(0,-4,0))
tex.image=images['neutral']
camera.location=(0,-4,0)
aim(camera,(0,0,0))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dog-edited.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'dog-edited.glb'),export_format='GLB',export_cameras=False,export_lights=False)
(OUT/'report.json').write_text(json.dumps({'source':'meshy-dog-simple-v1/dog.glb','changed_face_vertices':changed,'expressions':list(images),'rigged':False},indent=2))
