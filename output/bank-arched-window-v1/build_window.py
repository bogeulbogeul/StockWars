"""Native bank interior arched window from the user's reference."""
import bpy,sys,math,json,bmesh
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,extrude,arch_outline
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Bank_Honey_Wood',(.43,.25,.12),.84)
glass=material('Soft_Blue_Glass',(.29,.60,.72),.35)
s=glass.node_tree.nodes.get('Principled BSDF');s.inputs['Emission Color'].default_value=(.21,.44,.57,1);s.inputs['Emission Strength'].default_value=.14

def ring(name,outer,inner,yf,yb):
 n=len(outer);v=[(x,y,z) for y in [yf,yb] for contour in [outer,inner] for x,z in contour];f=[]
 for i in range(n):
  j=(i+1)%n
  f.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
 m=bpy.data.meshes.new(name);m.from_pydata(v,[],f);m.update()
 bm=bmesh.new();bm.from_mesh(m);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(m);bm.free()
 o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.data.materials.append(wood);bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Soft_Frame_Edges','BEVEL');mod.width=.009;mod.segments=5;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=abs(p.normal.y)<.9
 mod=o.modifiers.new('Frame_Normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
outer=arch_outline(.34,1.12,.05,64);inner=arch_outline(.26,1.12,.13,64)
ring('Continuous_Arched_Frame',outer,inner,-.095,.055)
extrude('Recessed_Blue_Glazing',arch_outline(.265,1.12,.125,64),-.040,-.015,glass,.003)
# Inner bars sit below the frame's front face and terminate in its inner edge.
box('Central_Mullion',(.028,.032,1.263),(0,-.063,.7545),wood,.006)
for z in [.47,.81,1.15]:
 half=.265 if z<=1.12 else math.sqrt(.265**2-(z-1.12)**2)
 box('Horizontal_Muntin',(half*2,.032,.026),(0,-.060,z),wood,.005)
box('Rounded_Window_Sill',(.80,.255,.070),(0,-.045,.055),wood,.016)
box('Sill_Lower_Apron',(.635,.10,.065),(0,.002,.004),wood,.010)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-arched-window.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-arched-window.blend'))
tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
box('Preview_Ground',(200,200,.02),(0,0,-.045),material('Ground',(.65,.65,.65)),.001)
for loc,power,size in [((-3,-4,5),450,4),((3,1,4),250,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=1.90
scene.render.resolution_x=1000;scene.render.resolution_y=1200
for name,loc in [('front-right',(2,-6,2.4)),('front',(0,-6,.75))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.72))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'triangles':tri,'bytes':(ROOT/'Bank-arched-window.glb').stat().st_size,'textures':0,'status':'standalone model; game integration pending'},indent=2),encoding='utf-8')
