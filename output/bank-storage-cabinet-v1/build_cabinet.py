"""Honey wood bank cabinet with brass hardware and independent tabletop props."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,disk,stroke
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Bank_Honey_Wood',(.43,.25,.12),.84)
panel=material('Recessed_Wood_Panels',(.345,.181,.067),.86)
gold=material('Cabinet_Brass',(.57,.34,.095),.48);gold.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=.6
paper=material('Book_Ivory_Pages',(.70,.62,.46),.9)
bookm=[material('Book_Cover_'+str(i),c,.84) for i,c in enumerate([(.15,.19,.08),(.29,.13,.045),(.38,.21,.07),(.12,.16,.13)])]
# Low solid plinth supports a compact cabinet; all details share a single frontage.
box('Cabinet_Low_Plinth',(1.66,.46,.085),(0,0,.0575),wood,.013)
box('Cabinet_Carcass',(1.59,.405,.636),(0,.012,.414),panel,.012)
box('Cabinet_Top',(1.72,.50,.070),(0,0,.770),wood,.014)
for x in [-.765,.765]:box('Cabinet_Front_Stile',(.052,.043,.63),(x,-.208,.414),wood,.008)
box('Cabinet_Center_Stile',(.042,.043,.63),(.245,-.208,.414),wood,.007)
# Pair of inset doors on the left; door frames are fitted around recessed center fields.
for cx in [-.505,-.015]:
 box('Door_Center_Field',(.425,.026,.53),(cx,-.214,.407),panel,.010)
 for x in [cx-.226,cx+.226]:box('Door_Vertical_Frame',(.033,.030,.574),(x,-.233,.410),wood,.006)
 for z in [.139,.681]:box('Door_Horizontal_Frame',(.425,.030,.033),(cx,-.233,z),wood,.006)
 knobx=cx+(.145 if cx<-.3 else -.145)
 disk('Door_Knob_Mount',knobx,-.258,.42,.022,.012,gold)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(knobx,-.280,.42));o=bpy.context.object;o.name='Door_Brass_Knob';o.scale=(.022,.020,.022);o.data.materials.append(gold)
 for p in o.data.polygons:p.use_smooth=True
# Three shallow framed drawer fronts to the right.
for z in [.220,.414,.608]:
 box('Drawer_Front',(.459,.042,.174),(.510,-.222,z),wood,.009)
 box('Drawer_Inset',(.397,.012,.116),(.510,-.248,z),panel,.008)
 disk('Drawer_Knob_Mount',.510,-.260,z,.021,.010,gold)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(.510,-.282,z));o=bpy.context.object;o.name='Drawer_Brass_Knob';o.scale=(.021,.020,.021);o.data.materials.append(gold)
 for p in o.data.polygons:p.use_smooth=True
cabinet=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-cabinet-only.glb'),export_format='GLB',use_selection=True)
# Upright ledgers with dark covers, inset pages and discreet brass spine bands.
for i in range(4):
 x=-.66+i*.115;h=[.365,.395,.373,.410][i];z=.805+h/2;mat=bookm[i]
 box('Ledger_Pages',(.080,.19,h-.025),(x,.045,z),paper,.006)
 for dx in [-.047,.047]:box('Ledger_Cover',(.012,.218,h),(x+dx,.035,z),mat,.005)
 box('Ledger_Spine',(.10,.017,h),(x,-.068,z),mat,.007)
 for dz in [-h*.30,h*.29]:box('Ledger_Spine_Band',(.096,.008,.012),(x,-.081,z+dz),gold,.003)
 box('Ledger_Spine_Label',(.043,.006,.049),(x,-.082,z+.015),panel,.004)
# Small wooden keepsake chest on the right.
box('Keepsake_Chest_Base',(.435,.265,.155),(.505,.010,.883),panel,.012)
box('Keepsake_Chest_Lid',(.451,.277,.066),(.505,.010,.991),wood,.015)
for x in [.355,.655]:
 box('Chest_Lid_Band',(.014,.279,.008),(x,.010,1.027),gold,.003)
box('Chest_Latch_Plate',(.052,.014,.069),(.505,-.136,.945),gold,.007)
disk('Chest_Lock',.505,-.151,.912,.021,.014,gold)
# Reuse the matching ceramic plant as a small tabletop version.
before=set(bpy.data.objects)
with bpy.data.libraries.load(str(ROOT.parent/'bank-potted-plant-v1/Bank-potted-plant.blend'),link=False) as (src,dst):dst.objects=src.objects
added=set(bpy.data.objects)-before
root=bpy.data.objects.new('Small_Table_Plant',None);bpy.context.collection.objects.link(root)
for ob in added:
 bpy.context.collection.objects.link(ob)
 if ob.parent not in added:ob.parent=root
root.scale=(.32,)*3;root.location=(-.105,.015,.800)
asset=list(bpy.context.scene.objects)
for ob in asset:
 if ob.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-storage-cabinet.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-storage-cabinet.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.55
box('Preview_Ground',(200,200,.02),(0,0,-.003),material('Ground',(.65,.65,.65)),.001)
for loc,power,size in [((-3,-4,5),400,4),((3,1,4),220,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2,-5,2.6));cam=bpy.context.object;scene.camera=cam;cam.rotation_euler=(Vector((0,0,.60))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.23
scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.filepath=str(ROOT/'cabinet.png');bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'cabinet_dimensions':[1.72,.50,.805],'somangi_reference_height':.97425,'countertop_ratio':.805/.97425,'source':'reference bank cabinet; two doors and three drawers','textures':0,'bytes':(ROOT/'Bank-storage-cabinet.glb').stat().st_size,'status':'standalone model; drawers and doors static; room placement pending'},indent=2),encoding='utf-8')

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
 for v in o.data.vertices:v.co=Vector((v.co.x/1.95+1.40,v.co.y/1.95,(v.co.z-bottom)/1.95+.015))
cam.location=(2,-5,2.6);cam.rotation_euler=(Vector((.45,0,.60))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.1
scene.render.filepath=str(ROOT/'scale.png');bpy.ops.render.render(write_still=True)
