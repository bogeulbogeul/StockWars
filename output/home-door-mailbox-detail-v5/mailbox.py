"""Native clay mailbox with an actual slot, fitted access panel and brass fittings."""
import bpy,math
from exterior_geometry import box,extrude,stroke,disk,finish

def build(root,wood,cream,red,gold,dark):
 before=set(bpy.context.scene.objects)
 box('Mailbox_Grounded_Foot',(.215,.19,.055),(0,0,.0275),cream,.008)
 box('Mailbox_Post_Foot_Socket',(.104,.104,.033),(0,0,.062),wood,.005)
 box('Mailbox_Oak_Post',(.075,.075,.335),(0,0,.216),wood,.005)
 box('Mailbox_Body_Support_Saddle',(.18,.15,.035),(0,0,.370),wood,.006)
 def arch(r,bottom):
  return [(-r,bottom),(r,bottom),(r,.53)]+[(r*math.cos(math.pi*i/64),.53+r*math.sin(math.pi*i/64)) for i in range(1,65)]
 body=extrude('Mailbox_Red_Rounded_Body',arch(.13,.36),-.11,.11,red,.007)
 cavity=extrude('Mailbox_Inner_Cavity_Cutter',arch(.111,.379),-.092,.091,red,.003)
 def subtract(cutter,name):
  bpy.context.view_layer.objects.active=body
  mod=body.modifiers.new(name,'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 subtract(cavity,'Closed_Inner_Cavity')
 slot=box('Mailbox_Slot_Cutter',(.184,.072,.022),(0,-.106,.536),dark,.006)
 subtract(slot,'True_Rounded_Mail_Slot')
 box('Mailbox_Dark_Slot_Interior',(.185,.006,.024),(0,-.064,.536),dark,.004)
 box('Mailbox_Rounded_Weather_Lip',(.200,.018,.011),(0,-.118,.553),red,.005)
 # Close-fit front door with a continuous soft edge and a shallow inset face.
 box('Mailbox_Front_Access_Flap',(.224,.018,.158),(0,-.119,.443),red,.011)
 box('Mailbox_Front_Inset_Face',(.201,.006,.134),(0,-.131,.443),red,.008)
 outline=arch(.123,.367)
 stroke('Mailbox_Continuous_Front_Rim',[(x,-.1115,z) for x,z in outline+[outline[0]]],.0022,red)
 # Envelope is a shallow relief with a folded flap and lower corner seams.
 box('Mailbox_Envelope_Emblem',(.104,.008,.070),(-.018,-.140,.445),cream,.005)
 fold=bpy.data.materials.new('Mailbox_Envelope_Fold_Sand');fold.diffuse_color=(.50,.37,.23,1);fold.use_nodes=True
 shader=fold.node_tree.nodes['Principled BSDF'];shader.inputs['Base Color'].default_value=(.50,.37,.23,1);shader.inputs['Roughness'].default_value=.85
 stroke('Mailbox_Envelope_Flap_Fold',[(-.063,-.145,.473),(-.018,-.145,.440),(.027,-.145,.473)],.00135,fold)
 for x,mid in [(-.063,-.033),(.027,-.003)]:
  stroke('Mailbox_Envelope_Lower_Fold',[(x,-.145,.417),(mid,-.145,.439)],.0010,fold)
 disk('Mailbox_Brass_Pull_Mount',.073,-.1355,.445,.012,.004,gold)
 disk('Mailbox_Brass_Pull_Stem',.073,-.1405,.445,.004,.009,gold)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=.0085,location=(.073,-.146,.445))
 o=bpy.context.object;o.name='Mailbox_Round_Brass_Pull';o.data.materials.append(gold)
 for polygon in o.data.polygons:polygon.use_smooth=True
 for z in (.402,.484):
  bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.0033,depth=.026,location=(-.108,-.130,z))
  o=bpy.context.object;o.name='Mailbox_Soft_Brass_Hinge';finish(o,gold,.001)
  for polygon in o.data.polygons:polygon.use_smooth=len(polygon.vertices)==4
 objects=[o for o in bpy.context.scene.objects if o not in before]
 for o in objects:o.parent=root
 return objects
