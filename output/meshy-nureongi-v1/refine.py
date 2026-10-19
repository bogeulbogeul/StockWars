"""Smooth the actual Meshy geometry and paint expressions without relief."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'source.glb'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj
obj.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
print('BOUNDS',[(min(v.co[i] for v in obj.data.vertices),max(v.co[i] for v in obj.data.vertices)) for i in range(3)])
rem=obj.modifiers.new('Uniform smooth surface','REMESH')
rem.mode='VOXEL'
rem.voxel_size=.009
bpy.ops.object.modifier_apply(modifier=rem.name)
# Shade normals and a mild Laplacian pass remove generation faceting while
# preserving the source silhouette; no face geometry is added.
mod=obj.modifiers.new('Gentle surface smoothing','SMOOTH')
mod.factor=.55
mod.iterations=20
bpy.ops.object.modifier_apply(modifier=mod.name)
for p in obj.data.polygons:
    p.use_smooth=True
TAN=(.85,.65,.38,1)
CREAM=(.98,.90,.73,1)
DARK=(.12,.065,.025,1)
INNER=(.82,.62,.45,1)
def linear(c):
    return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def material(name,color):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=tuple(linear(c) for c in color[:3])+(1,)
    bs.inputs['Roughness'].default_value=.9
    return m
base=material('Wheat tan matte',TAN)
cream=material('Cream paws',CREAM)
inside=material('Warm inner ears',INNER)
obj.data.materials.clear()
obj.data.materials.append(base)
obj.data.materials.append(cream)
obj.data.materials.append(inside)

def image(expression):
    pixels=[]
    n=768
    for j in range(n):
        z=j/(n-1)*2-1
        for i in range(n):
            x=(i/(n-1)-.5)*1.6
            c=TAN
            if expression!='back' and (x/.275)**2+((z-.225)/.18)**2<1:
                c=CREAM
            if expression!='back' and (x/.205)**2+((z+.33)/.36)**2<1:
                c=CREAM
            if z<-.81 or (abs(x)>.48 and -.45<z<-.04):
                c=CREAM
            for s in (-1,1):
                if expression=='back':
                    continue
                dx=x-s*.155
                dz=z-.43
                if expression=='neutral':
                    eye=(dx/.045)**2+(dz/.069)**2<1
                else:
                    eye=abs(dz-(.026 if expression=='happy' else 0)+.055*(dx/.05)**2)<.008 and abs(dx)<.05
                if eye:
                    c=DARK
                if expression=='neutral' and ((dx+.012)/.012)**2+((dz-.025)/.014)**2<1:
                    c=(1,1,1,1)
                if abs(math.sqrt((x-s*.04)**2+(z-.245)**2)-.04)<.006 and z<.245:
                    c=DARK
            # Nose pigment; only the existing nose volume is retained.
            if expression!='back' and (x/.055)**2+((z-.31)/.038)**2<1:
                c=DARK
            pixels.extend(c)
    im=bpy.data.images.new('Paint '+expression,width=n,height=n,alpha=False)
    im.pixels=pixels
    im.filepath_raw=str(OUT/('paint-'+expression+'.png'))
    im.file_format='PNG'
    im.save()
    im.pack()
    return im
images={e:image(e) for e in ('neutral','blink','happy','back')}
paint=material('Face and belly paint - expressions',TAN)
tex=paint.node_tree.nodes.new('ShaderNodeTexImage')
tex.name='EXPRESSION_IMAGE'
tex.image=images['neutral']
paint.node_tree.links.new(tex.outputs['Color'],paint.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
obj.data.materials.append(paint)
backmat=material('Back painted color',TAN)
backtex=backmat.node_tree.nodes.new('ShaderNodeTexImage')
backtex.image=images['back']
backmat.node_tree.links.new(backtex.outputs['Color'],backmat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
obj.data.materials.append(backmat)
uv=obj.data.uv_layers.new(name='PaintProjection')
uvnode=paint.node_tree.nodes.new('ShaderNodeUVMap')
uvnode.uv_map=uv.name
paint.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
backuv=backmat.node_tree.nodes.new('ShaderNodeUVMap')
backuv.uv_map=uv.name
backmat.node_tree.links.new(backuv.outputs['UV'],backtex.inputs['Vector'])
for p in obj.data.polygons:
    x,y,z=p.center
    p.material_index=3 if y<-.07 else 4
    for li in p.loop_indices:
        v=obj.data.vertices[obj.data.loops[li].vertex_index].co
        uv.data[li].uv=(v.x/1.6+.5,(v.z+1)/2)
uv.active_render=True
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.render.resolution_x=800
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.world.color=(.4,.4,.4)
scene.view_settings.view_transform='Standard'
def aim(o):
    o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
for loc,power in [((-3,-4,5),400),((3,-2,3),250),((0,3,3),180)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    bpy.context.object.data.energy=power
    bpy.context.object.data.size=4
    aim(bpy.context.object)
bpy.ops.object.camera_add(location=(0,-4,0))
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=2.25
scene.camera=cam
def render(label,loc):
    cam.location=loc
    aim(cam)
    scene.render.filepath=str(OUT/(label+'.png'))
    bpy.ops.render.render(write_still=True)
for label,loc in [('front',(0,-4,0)),('side',(4,0,0)),('back',(0,4,0))]:
    render(label,loc)
tex.image=images['happy']
render('happy',(0,-4,0))
tex.image=images['neutral']
cam.location=(0,-4,0)
aim(cam)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'nureongi.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'nureongi.glb'),export_format='GLB',export_cameras=False,export_lights=False)
obj.data.calc_loop_triangles()
(OUT/'report.json').write_text(json.dumps({'triangles':len(obj.data.loop_triangles),'expressions':list(images),'geometry_source':'Meshy 6 Lite faceless input','rigged':False},indent=2))
