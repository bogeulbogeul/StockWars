"""Seal the header behind the sign and inset the complete chart relief."""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-reference-architecture-v20'/'CipherSecurities-reference.blend'))
scene=bpy.context.scene;cream=bpy.data.materials['Trim_Cream']
plaque=bpy.data.objects['Cipher_Logo_Navy_Plaque']
corners=[plaque.matrix_world@Vector(c) for c in plaque.bound_box]
low=Vector(tuple(min(v[i] for v in corners) for i in range(3)))
high=Vector(tuple(max(v[i] for v in corners) for i in range(3)))
center=(low+high)/2
# This is an actual solid wall/header behind the plaque, joined into the beam.
box('Portico_Closed_Upper_Header',(1.64,.42,.46),(center.x,-1.55,1.61),cream,.006)
box('Portico_Closed_Header_Soffit',(1.64,.66,.09),(center.x,-1.75,1.825),cream,.005)
# The paired capital blocks meet through their bevels; replace each pair with
# one closed block so their meeting line cannot expose a black vertical slit.
capitals=[o for o in scene.objects if o.name.startswith('Portico_Column_Capital')]
capital_groups=[[o for o in capitals if (o.location.x<center.x)==(side<0)] for side in (-1,1)]
for group in capital_groups:
 points=[o.matrix_world@Vector(c) for o in group for c in o.bound_box]
 a=Vector(tuple(min(p[i] for p in points) for i in range(3)))
 b=Vector(tuple(max(p[i] for p in points) for i in range(3)))
 for o in group:bpy.data.objects.remove(o,do_unlink=True)
 box('Portico_Column_Capital_Pair',b-a,(a+b)/2,cream,.006)
# Keep the complete line, arrow head and six bars inside the inner navy field.
mark=[o for o in scene.objects if o.name.startswith(('Reference_Chart_Bar','Reference_Rising_Chart_Line','Reference_Chart_Arrowhead'))]
points=[o.matrix_world@Vector(c) for o in mark for c in o.bound_box]
lo=Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
mid=(lo+hi)/2
inner_w=(high.x-low.x)-.10;inner_h=(high.z-low.z)-.085
scale=min(inner_w/(hi.x-lo.x),inner_h/(hi.z-lo.z),.82)
tr=Matrix.Translation((center.x,mid.y,center.z))@Matrix.Diagonal((scale,1,scale,1))@Matrix.Translation(-mid)
for o in mark:o.matrix_world=tr@o.matrix_world
bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in mark for c in o.bound_box]
margins={'left':min(p.x for p in points)-low.x,'right':high.x-max(p.x for p in points),
 'bottom':min(p.z for p in points)-low.z,'top':high.z-max(p.z for p in points)}
assert min(margins.values())>.035,margins
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.cycles.samples=32
scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-sealed-sign.blend'))
scene.render.resolution_x=1000;scene.render.resolution_y=850
cam=scene.camera;cam.data.type='ORTHO';cam.data.ortho_scale=1.72
for name,loc in [('sign-detail',(1.3,-6,1.8)),('sign-front',(center.x,-7,center.z))]:
 cam.location=loc;cam.rotation_euler=(Vector((center.x,-1.77,1.62))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'cipher-reference-architecture-v20','markScale':scale,
 'navyFieldMargins':margins,'headerSolid':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
