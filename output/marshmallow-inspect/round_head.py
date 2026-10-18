import bpy,math,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent.parent/'marshmallow-head-rounded-v1';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'marshmallow-inspect/original.blend'))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
changed=0
for v in mesh.data.vertices:
    x,y,z=v.co
    if y>0 and z>-.05:
        blend=smooth(-.05,.16,z)*smooth(0,.20,y)
        # Round the rear hemisphere while preserving face and neck attachment.
        target=.57*math.sqrt(max(0,1-(x/.61)**2-((z-.40)/.56)**2))
        delta=max(0,target-y)*blend*.85
        v.co.y+=delta
        if delta>1e-6:changed+=1
for f in mesh.data.polygons:f.use_smooth=True
for e in mesh.data.edges:e.use_edge_sharp=False
if mesh.data.has_custom_normals:mesh.data.normals_split_custom_set([(0,0,0)]*len(mesh.data.loops))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'marshmallow-rounded.blend'))
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
bpy.ops.export_scene.gltf(filepath=str(P/'marshmallow-rounded.glb'),use_selection=True,export_format='GLB')
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO'
s.display.shading.studio_light='paint.sl';s.display.shading.color_type='SINGLE'
s.display.shading.single_color=(.9,.9,.9);s.display.shading.show_shadows=False
s.render.resolution_x=700;s.render.resolution_y=700;s.render.resolution_percentage=100
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.28;s.camera=cam
for name,pos in [('side',(7,0,0)),('rear-angle',(3,7,.6)),('front',(0,-7,0))]:
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
(P/'notes.json').write_text(json.dumps({'rear_head_vertices_changed':changed,'front_half_unchanged':True,'arm_separation':'not yet modified'},indent=2))
