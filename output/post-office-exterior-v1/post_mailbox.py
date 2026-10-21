"""Rounded collection box with inset slot, service door and shared envelope relief."""
import bpy
from mathutils import Matrix
from exterior_geometry import box as primitive_box, disk, material, extrude
from bookstore_window import surround
from post_sign import rounded


def contour(w,h,r,z):
    return [(1.02+x,t) for x,t in rounded(w,h,r,z)]


def box(name,size,loc,mat,bevel=.015):
    obj=primitive_box(name,size,loc,mat,0)
    bpy.context.view_layer.objects.active=obj
    if bevel:
        mod=obj.modifiers.new('Fine_Rounded_Edges','BEVEL')
        mod.width=bevel;mod.segments=12;mod.harden_normals=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:poly.use_smooth=True
    mod=obj.modifiers.new('Smooth_Planar_Finish','WEIGHTED_NORMAL')
    mod.keep_sharp=True;mod.weight=50
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def build_mailbox(stone,red,gold,slot):
    box('Collection_Box_Stone_Foot',(.47,.44,.10),(1.02,-1.05,.05),stone,.025)
    box('Collection_Box_Pedestal',(.28,.28,.24),(1.02,-1.05,.20),red,.025)
    box('Pedestal_Upper_Collar',(.33,.32,.065),(1.02,-1.05,.32),red,.022)
    body=box('Collection_Box_Body',(.43,.37,.70),(1.02,-1.05,.64),red,.065)
    box('Cap_Underside_Rim',(.44,.38,.035),(1.02,-1.05,.970),red,.016)
    box('Collection_Box_Cap',(.48,.43,.085),(1.02,-1.05,1.018),red,.040)
    cutter=box('Slot_Cutter',(.251,.13,.037),(1.02,-1.235,.85),slot,.009)
    bpy.context.view_layer.objects.active=body
    mod=body.modifiers.new('Recessed_Mail_Opening','BOOLEAN')
    mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    box('Dark_Slot_Interior',(.255,.01,.045),(1.02,-1.190,.85),slot,.008)
    surround('Continuous_Brass_Slot_Frame',contour(.30,.080,.016,.85),
             contour(.251,.037,.009,.85),-1.259,-1.226,gold)
    box('Rain_Lip_Over_Slot',(.315,.055,.022),(1.02,-1.246,.901),red,.009)
    seam=material('Mailbox_Red_Joinery',(.37,.045,.030))
    surround('Collection_Door_Fine_Reveal',contour(.332,.39,.024,.58),
             contour(.322,.38,.020,.58),-1.239,-1.229,seam)
    door=extrude('Collection_Door_Inset',contour(.319,.377,.026,.58),
                 -1.244,-1.228,red,.004)
    for poly in door.data.polygons:poly.use_smooth=True
    bpy.context.view_layer.objects.active=door
    mod=door.modifiers.new('Door_Smooth_Normals','WEIGHTED_NORMAL')
    mod.keep_sharp=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for z in [.445,.715]:
        box('Service_Door_Hinge',(.020,.020,.047),(.862,-1.247,z),gold,.005)
    disk('Service_Door_Lock',1.135,-1.250,.455,.017,.012,gold)
    box('Lock_Key_Slit',(.003,.003,.014),(1.135,-1.258,.455),slot,.001)
    # Reuse the exact adopted sign envelope meshes; only scale and placement differ.
    placement=(Matrix.Translation((1.02,-1.252,.635)) @
               Matrix.Scale(.42,4) @ Matrix.Translation((0,1.071,-1.98)))
    for src in list(bpy.context.scene.objects):
        if src.name.startswith('Envelope_'):
            obj=src.copy();obj.name='Mailbox_'+src.name
            bpy.context.collection.objects.link(obj)
            obj.matrix_world=placement @ src.matrix_world
