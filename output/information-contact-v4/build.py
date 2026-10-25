"""Seal porch timber joints and entry contact using actual solid geometry."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'information-roof-crafted-v3/Information-crafted-roof.blend'))
s=bpy.context.scene
def union(base,other):
 bpy.context.view_layer.objects.active=base
 m=base.modifiers.new('Closed_Contact_Union','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=other
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(other,do_unlink=True)
wood=bpy.data.materials['Office_Honey_Wood']
# Extend the hidden back of the front fascia into the side eaves before union.
fascia=bpy.data.objects['Porch_Continuous_Timber_Fascia']
for v in fascia.data.vertices:
 if v.co.y>-1.280:v.co.y+=.016
fascia.data.update()
for o in list(s.objects):
 if o!=fascia and o.name.startswith(('Porch_Continuous_Timber_Fascia','Porch_Side_Eave','Porch_Continuous_Header')):union(fascia,o)
fascia.name='Porch_Joined_Timber_Frame'
# Rebuild the outer perimeter continuously: the old beveled strip ends leave a
# hairline at the exposed right corner even after their interiors are united.
bpy.data.objects.remove(fascia,do_unlink=True)
fascia=extrude('Porch_Joined_Timber_Frame',[(-.735,1.30),(.735,1.30),(.735,1.385),(0,1.955),(-.735,1.385)],-1.306,-.878,wood,.003)
cut=extrude('Triangle_Opening',[(-.625,1.405),(.625,1.405),(0,1.89)],-1.34,-.85,wood,0)
bpy.context.view_layer.objects.active=fascia
m=fascia.modifiers.new('Continuous_Triangle_Opening','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
pediment=bpy.data.objects['Porch_Cream_Pediment']
bpy.data.objects.remove(pediment,do_unlink=True)
extrude('Porch_Cream_Pediment',[(-.725,1.31),(.725,1.31),(.725,1.38),(0,1.945),(-.725,1.38)],-1.302,-1.10,bpy.data.materials['Office_Cream'],.002)
# A common foundation/step solid removes coplanar overlap directly below the door.
base=bpy.data.objects['Foundation'];steps=bpy.data.objects['Entry_Continuous_Two_Step_Solid']
union(base,steps);base.name='Foundation_Joined_Entry_Steps'
# Close the beveled wall toe behind the porch, fully embedded in the existing wall.
cream=bpy.data.materials['Office_Cream']
for x in (-.53,.53):
 toe=box('Wall_Toe_Contact', (.40,.052,.115),(x,-.896,.1575),cream,.002)
 union(bpy.data.objects['Smooth_Walls_Windowless_Back'],toe)
# Seat the door bottom and surround below the step surface without altering panels.
for name in ['Central_Wood_Door','Door_Continuous_Cream_Surround']:
 o=bpy.data.objects[name]
 for v in o.data.vertices:
  p=o.matrix_world@v.co
  if p.z<.19:
   p.z-=.032*min(1,max(0,(.19-p.z)/.025));v.co=o.matrix_world.inverted()@p
 o.data.update()
bpy.context.view_layer.update()
checks={}
for o in [fascia,base]:
 bm=bmesh.new();bm.from_mesh(o.data)
 checks[o.name]={'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges)}
 assert all(v==0 for v in checks[o.name].values()),checks
 bm.free()
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Information-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=24;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.1,1.1),4.5),('porch-detail',(2,-5,2.6),(0,-1.12,1.58),1.75),('entry-detail',(2,-5,1.6),(0,-1.05,.34),1.75),('entry-front',(0,-5,1.0),(0,-1.0,.30),1.7)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Information-sealed-contact.blend'))
(R/'validation.json').write_text(json.dumps({'closedSolids':checks,'gameApplied':False,'sha256':hashlib.sha256((R/'Information-clean.glb').read_bytes()).hexdigest()},indent=2))
