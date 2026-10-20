"""Assemble latest bank furniture in the existing room, preserving source assets."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude,arch_outline
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-desk-decor-v1/Bank-decor-room-preview.blend'))
placements=[]
def append_asset(folder,file,name,loc,angle=0,scale=1):
 before=set(bpy.data.objects)
 with bpy.data.libraries.load(str(ROOT.parent/folder/file),link=False) as (src,dst):dst.objects=src.objects
 added=set(bpy.data.objects)-before
 coll=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(coll)
 root=bpy.data.objects.new(name+'_Root',None);coll.objects.link(root)
 for o in added:
  if o.type not in {'MESH','CURVE','EMPTY'}:bpy.data.objects.remove(o,do_unlink=True);continue
  coll.objects.link(o)
  if o.parent not in added:o.parent=root
 root.location=loc;root.rotation_euler.z=angle;root.scale=(scale,)*3
 placements.append({'asset':name,'source':folder+'/'+file,'location':loc,'rotation_z':angle,'scale':scale})
 return root
append_asset('bank-sofa-square-seat-v4','Bank-sofa-native.blend','Waiting_Sofa',(-3.30,-.80,.010),math.pi/2,1.22)
append_asset('bank-safe-hinges-v2','Bank-safe.blend','Vault_Safe',(2.70,2.40,.024),0,1.10)
append_asset('bank-arched-window-v1','Bank-arched-window.blend','Arched_Window',(3.99,-.35,.94),-math.pi/2,1.03)
# Cut a matching arched opening through the right plaster wall.
wall=next(o for o in bpy.context.scene.objects if o.name.startswith('Side_Wall') and o.location.x>0)
cutter=extrude('Temporary_Window_Opening',arch_outline(.266,1.12,.125,64),-.35,.35,wall.data.materials[0],0)
cutter.location=(3.99,-.35,.94);cutter.rotation_euler.z=-math.pi/2;cutter.scale=(1.03,)*3
bpy.context.view_layer.objects.active=wall
mod=wall.modifiers.new('Arched_Window_Opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
bpy.context.view_layer.update()
# Record world-space bounds and reject non-finite geometry.
bounds={}
for p in placements:
 root=bpy.data.objects[p['asset']+'_Root'];objs=[o for o in root.children_recursive if o.type=='MESH']
 pts=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box]
 assert all(math.isfinite(v) for pt in pts for v in pt)
 bounds[p['asset']]={'min':[min(v[i] for v in pts) for i in range(3)],'max':[max(v[i] for v in pts) for i in range(3)]}
# Floor access corridor x=-.65..+.65 remains clear of the new furnishings.
for name in ['Waiting_Sofa','Vault_Safe']:
 b=bounds[name];assert b['max'][0]<-.65 or b['min'][0]>.65
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE','EMPTY'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-furnished-room.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.cycles.samples=48;scene.render.resolution_x=1600;scene.render.resolution_y=1200
cam=scene.camera
scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-furnished-room.blend'))
cam.location=(9,-12,10);cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.5
# Hide the near side wall only for this alternate inspection render.
for o in bpy.context.scene.objects:
 if o.name.startswith(('Side_Wall','Side_Top_Trim')) and o.location.x>0:o.hide_render=True
scene.render.filepath=str(ROOT/'alternate.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'furnished room model; game runtime integration pending','placements':placements,'bounds':bounds,'validation':['finite transformed bounds','central approach corridor clear of new furniture','arched opening cut in right wall'],'preserved':['existing desk','executive chair','gold sprout wall mark','desktop props']},indent=2),encoding='utf-8')
