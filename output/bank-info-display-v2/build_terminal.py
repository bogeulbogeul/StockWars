"""Warm wooden bank information terminal, static decorative screen."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Bank_Honey_Wood',(.43,.25,.12),.84)
panel=material('Inset_Wood',(.345,.181,.067),.86)
bezel=material('Dark_Display_Bezel',(.018,.025,.031),.40)
gold=material('Muted_Brass',(.57,.34,.095),.48);gold.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=.6
blue=material('Soft_Blue_Display',(.085,.38,.57),.44)
bs=blue.node_tree.nodes['Principled BSDF'];bs.inputs['Emission Color'].default_value=(.07,.30,.47,1);bs.inputs['Emission Strength'].default_value=.35
ui=material('Display_Ivory',(.72,.86,.84),.65)
box('Terminal_Low_Plinth',(.59,.47,.065),(0,0,.0475),wood,.013)
box('Terminal_Base_Cabinet',(.525,.395,.46),(0,.015,.300),panel,.014)
for x in [-.24,.24]:box('Front_Cabinet_Stile',(.035,.035,.443),(x,-.193,.30),wood,.006)
box('Cabinet_Door',(.435,.025,.367),(0,-.202,.30),wood,.009)
box('Recessed_Door_Panel',(.363,.012,.294),(0,-.220,.30),panel,.010)
disk('Door_Knob_Base',-.132,-.234,.321,.018,.012,gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(-.132,-.252,.321));o=bpy.context.object;o.name='Door_Brass_Knob';o.scale=(.018,.018,.018);o.data.materials.append(gold)
for p in o.data.polygons:p.use_smooth=True
box('Terminal_Shelf',(.605,.49,.065),(0,-.010,.549),wood,.013)
# A compact rear support meets the tilted screen housing above the shelf.
box('Screen_Rear_Support',(.38,.25,.11),(0,.090,.607),wood,.018)
root=bpy.data.objects.new('Inclined_Display_Root',None);bpy.context.collection.objects.link(root)
root.location=(0,.018,.845);root.rotation_euler.x=math.radians(-20)
parts=[]
def screenbox(name,size,loc,mat,r):
 ob=box(name,size,loc,mat,r);ob.parent=root;parts.append(ob);return ob
screenbox('Rounded_Wood_Display_Housing',(.58,.102,.615),(0,0,0),wood,.024)
screenbox('Inset_Display_Lining',(.476,.012,.472),(0,-.054,.027),bezel,.015)
mesh=bpy.data.meshes.new('Display_Glass_Surface')
mesh.from_pydata([(-.219,-.061,.027-.217),(.219,-.061,.027-.217),(.219,-.061,.027+.217),(-.219,-.061,.027+.217)],[],[(0,1,2,3)])
mesh.uv_layers.new(name='Display_UV')
for loop,uv in zip(mesh.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=uv
mat=material('Illuminated_Display_Glass',(.03,.1,.16),.18)
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Coat Weight'].default_value=.65;bs.inputs['Coat Roughness'].default_value=.12
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'display-ui.png'));tex.image.pack()
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.8
ob=bpy.data.objects.new('Flush_Glass_Display',mesh);bpy.context.collection.objects.link(ob);ob.parent=root;mesh.materials.append(mat)
ob=disk('Brass_Screen_Button',0,-.061,-.251,.023,.010,gold);ob.parent=root
# Convert any curve-based detail before standalone export.
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-info-terminal.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-info-terminal.blend'))
bpy.context.view_layer.update();pts=[o.matrix_world@Vector(c) for o in asset if o.type=='MESH' for c in o.bound_box]
dim=[max(p[i] for p in pts)-min(p[i] for p in pts) for i in range(3)]
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.55
box('Preview_Ground',(200,200,.02),(0,0,-.003),material('Ground',(.65,.65,.65)),.001)
for loc,power,size in [((-3,-4,5),400,4),((3,1,4),220,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-5,2.6));cam=bpy.context.object;scene.camera=cam;cam.rotation_euler=(Vector((0,0,.59))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.53
scene.render.resolution_x=1100;scene.render.resolution_y=1200;scene.render.filepath=str(ROOT/'terminal.png');bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'dimensions':dim,'reference_body_height':.97425,'height_ratio':dim[2]/.97425,'screen_center_height':.845,'textures':1,'bytes':(ROOT/'Bank-info-terminal.glb').stat().st_size,'status':'decorative model, not functional banking UI; room placement pending'},indent=2),encoding='utf-8')

# Bring in the exact previous scale-check character, without its room.
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent.parent/'web/assets/characters/3d/somangi/wave.glb'));added=set(bpy.data.objects)-before
scene.frame_set(1);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();snaps=[]
for ob in added:
 if ob.type!='MESH' or ob.name.startswith('Icosphere'):continue
 ev=ob.evaluated_get(deps);me=bpy.data.meshes.new_from_object(ev,depsgraph=deps);me.transform(ob.matrix_world)
 obj=bpy.data.objects.new('Somangi_Reference',me);scene.collection.objects.link(obj);snaps.append(obj)
for ob in added:bpy.data.objects.remove(ob,do_unlink=True)
bottom=min(v.co.z for o in snaps for v in o.data.vertices)
for o in snaps:
 for v in o.data.vertices:v.co=Vector((v.co.x/1.95+.85,v.co.y/1.95,(v.co.z-bottom)/1.95+.015))
cam.location=(2,-5,2.6);cam.rotation_euler=(Vector((.35,0,.60))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.05
scene.render.filepath=str(ROOT/'scale.png');bpy.ops.render.render(write_still=True)
