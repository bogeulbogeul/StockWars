"""Refine house door while preserving the right mailbox and uninstalled status."""
import bpy,bmesh,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,finish,extrude,disk
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-redesign-mailbox-v1'/'Home-redesign.blend'))
s=bpy.context.scene;wood=bpy.data.materials['Home_Honey_Wood'];gold=bpy.data.materials['Home_Brass_Handle']
for o in list(s.objects):
    if o.name.startswith(('Home_Door_Recessed_Lower_Panel','Home_Door_Glass_Cross_')):bpy.data.objects.remove(o,do_unlink=True)
def contour(w,h,r,z):
    p=[]
    for x0,z0,a0 in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(17):
            a=math.radians(a0+90*i/16);p.append((.43+x0+r*math.cos(a),z+z0+r*math.sin(a)))
    return p
a=contour(.412,.372,.013,.395);b=contour(.367,.327,.010,.395);n=len(a)
verts=[(x,y,z) for y in (-.866,-.843) for poly in (a,b) for x,z in poly];faces=[]
for i in range(n):
    j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
mesh=bpy.data.meshes.new('Home_Door_Panel_Ring');mesh.from_pydata(verts,[],faces)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));assert all(e.is_manifold for e in bm.edges);bm.to_mesh(mesh);bm.free()
o=bpy.data.objects.new('Home_Door_Continuous_Panel_Moulding',mesh);bpy.context.collection.objects.link(o);finish(o,wood,.002)
box('Home_Door_Clean_Panel_Inset',(.375,.010,.335),(.43,-.837,.395),wood,.008)
# One solid cross seats inside the existing round wood-lined reveal.
cx=.43;cz=.77;half=.007;r=.111
p=[(cx-half,cz-r),(cx+half,cz-r),(cx+half,cz-half),(cx+r,cz-half),
   (cx+r,cz+half),(cx+half,cz+half),(cx+half,cz+r),(cx-half,cz+r),
   (cx-half,cz+half),(cx-r,cz+half),(cx-r,cz-half),(cx-half,cz-half)]
extrude('Home_Door_Unified_Porthole_Cross',p,-.877,-.864,wood,.002)
# Add a modest brass escutcheon behind the existing round knob.
knob=bpy.data.objects.get('Home_Door_Knob')
if knob:
    p=knob.matrix_world.translation
    disk('Home_Door_Brass_Escutcheon',p.x,-.864,p.z,.026,.010,gold)
# Extend only the bottom bevel into the landing, leaving upper design untouched.
door=bpy.data.objects['Home_Arched_Wood_Door']
for v in door.data.vertices:
    p=door.matrix_world@v.co
    if p.z<.16:
        p.z-=.010*min(1,max(0,(.16-p.z)/.04));v.co=door.matrix_world.inverted()@p
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
mailroot=bpy.data.objects['Home_Right_Mailbox'];mail=set(mailroot.children_recursive)|{mailroot}
for name,objects in [('Home-with-right-mailbox.glb',asset),('Home-redesign.glb',[o for o in asset if o not in mail])]:
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/name),export_format='GLB',use_selection=True)
c=s.camera;s.cycles.samples=24
for name,loc,target,scale in [('door-detail',(1,-4,1.7),(.43,-.85,.60),1.5),('front-right',(4,-6,3.5),(.08,-.08,1.05),4.15)]:
    c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-door-polish.blend'))
