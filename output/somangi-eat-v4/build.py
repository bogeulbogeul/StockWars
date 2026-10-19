import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-v3/somangi-eat.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];head=bpy.data.objects['Somangi_Body'];s.frame_set(1)
with bpy.data.libraries.load(str(P.parent/'somangi-chew-v1/somangi-chew.blend'),link=False) as (source,target):
 target.meshes=['Surface mouth']
data=target.meshes[0];data.shape_keys.animation_data_clear()
mouth=bpy.data.objects.new('Mouth_Animated',data);bpy.context.collection.objects.link(mouth);mouth.parent=rig
vg=mouth.vertex_groups.new(name='Head');vg.add(list(range(len(data.vertices))),1,'REPLACE');mod=mouth.modifiers.new('Follow Head','ARMATURE');mod.object=rig
tex=bpy.data.images.load(str(P.parent/'somangi-chew-v1/mouth-clean-basecolor.png'));tex.pack();shader=head.data.materials[0].node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].links[0].from_node.image=tex
bvh=BVHTree.FromPolygons([v.co for v in head.data.vertices],[list(p.vertices) for p in head.data.polygons])
smile=mouth.shape_key_add(name='Rest_Smile');opened=data.shape_keys.key_blocks['Mouth_Open']
segments=64;rings=6;spec=[(0,0)]+[(j/rings,k*2*math.pi/segments) for j in range(1,rings+1) for k in range(segments)]
for i,(r,a) in enumerate(spec):
 x=-.008+.071*r*math.cos(a);z=.277+.026*(r*math.cos(a))**2+.008*r*math.sin(a)
 loc,_,_,_=bvh.ray_cast(Vector((x,-2,z)),Vector((0,1,0)));assert loc is not None
 smile.data[i].co=(x,loc.y-.004,z)
def smooth(a,b,t):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
rows=[]
for frame in range(1,74):
 s.frame_set(frame);t=(frame-1)/72
 active=smooth(.24,.34,t)*(1-smooth(.76,.87,t));smile.value=1-active
 opened.value=.5-.5*math.cos(4*math.pi*(t-.35)/.40) if .35<t<.75 else 0
 smile.keyframe_insert('value',frame=frame);opened.keyframe_insert('value',frame=frame)
 # A small prop dip makes the mouth visible while still held between the hands.
 food=rig.pose.bones['Food'];food.location+=food.bone.matrix_local.to_3x3().inverted()@Vector((0,0,-.055*active));food.keyframe_insert('location',frame=frame,group='Food')
 rows.append({'frame':frame,'mouth_open':opened.value,'rest_smile':smile.value,'food_dip':.055*active})
data.shape_keys.animation_data.action.name='Eat_Face'
s.frame_set(34);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.1,0))
for name,pos in [('eat-front',(0,-6,0)),('eat-side',(6,-.1,0)),('eat-angle',(2.5,-6,.6))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Food_Bun','Mouth_Animated']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE',export_cameras=False,export_lights=False)
sys.path.insert(0,str(P));from merge_clips import merge_clips
merge_clips(P/'somangi-eat.glb');(P/'mouth-timing.json').write_text(json.dumps(rows,indent=2));print('COMBINED_EAT_COMPLETE')
