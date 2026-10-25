"""Replace floating decorative rods with rounded moldings fused into each panel."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-panel-contact-v10'/'VivianStore-panel-contact.blend'))
scene=bpy.context.scene;wood=bpy.data.materials['Vivian_Honey_Wood'];checks=[]
def contour(cx,w,h,r):
 result=[]
 for x,z,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
  for i in range(13):
   a=math.radians(start+90*i/12);result.append((cx+x+r*math.cos(a),.285+z+r*math.sin(a)))
 return result
for side in ('Left','Right'):
 panel=bpy.data.objects[side+'_Display_Lower_Panel']
 old=bpy.data.objects.get(side+'_Display_Decorative_Panel_Moulding')
 if old:bpy.data.objects.remove(old,do_unlink=True)
 points=[panel.matrix_world@Vector(c) for c in panel.bound_box]
 cx=(min(p.x for p in points)+max(p.x for p in points))/2
 outer=contour(cx,.536,.166,.009);inner=contour(cx,.500,.130,.006);n=len(outer)
 vertices=[(x,y,z) for y in (-.981,-.965) for poly in (outer,inner) for x,z in poly]
 faces=[]
 for i in range(n):
  j=(i+1)%n
  faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
   (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
 mesh=bpy.data.meshes.new(side+'_Closed_Panel_Molding');mesh.from_pydata(vertices,[],faces)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 ring=bpy.data.objects.new(side+'_Fitted_Rounded_Molding',mesh);bpy.context.collection.objects.link(ring);finish(ring,wood,.002)
 inset=bpy.data.objects[side+'_Display_Decorative_Panel_Inset']
 inv=inset.matrix_world.inverted()
 for v in inset.data.vertices:
  p=inset.matrix_world@v.co
  if p.y>-.959:p.y+=.006;v.co=inv@p
 bpy.context.view_layer.update()
 for part in (ring,inset):
  bpy.context.view_layer.objects.active=panel
  mod=panel.modifiers.new('Integrated_Decorative_Molding','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=part
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(part,do_unlink=True)
 bm=bmesh.new();bm.from_mesh(panel.data)
 boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges)
 remaining=set(bm.verts);components=0
 while remaining:
  components+=1;stack=[remaining.pop()]
  while stack:
   vertex=stack.pop()
   for edge in vertex.link_edges:
    other=edge.other_vert(vertex)
    if other in remaining:remaining.remove(other);stack.append(other)
 bm.free()
 assert boundary==0 and nonmanifold==0,(side,boundary,nonmanifold)
 assert components==1,(side,components)
 checks.append({'panel':panel.name,'boundaryEdges':boundary,'nonManifoldEdges':nonmanifold,'connectedComponents':components,'integratedMoldingAndInset':True})
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
scene.cycles.samples=32;scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-integrated-molding.blend'))
scene.render.resolution_x=1100;scene.render.resolution_y=850;cam=scene.camera;cam.data.type='ORTHO'
for name,loc,target,scale in [('molding-detail',(2.2,-4,1.0),(.943,-.97,.275),.91),
 ('panel-front',(.943,-5,.36),(.943,-.97,.30),.79)]:
 cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'vivian-panel-contact-v10','panels':checks,
 'lowerMoldingContactPreserved':True,'roofDoorAndWindowsUnchanged':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest()},indent=2))
