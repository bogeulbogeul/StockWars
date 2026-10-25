"""Native sage information office following the adopted single-storey concept."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-exterior-clean-v1'/'Information-clean.blend'))
s=bpy.context.scene;wood=bpy.data.materials['Office_Honey_Wood'];green=bpy.data.materials['Office_Sage_Roof']
cream=bpy.data.materials['Office_Cream'];gold=bpy.data.materials['Office_Brass']
for o in list(s.objects):
    if o.name.startswith(('Front_Gable','Rear_Gable','Sealed_Sage_Roof','Wood_Roof_Edge','Broad_Green_Tile',
        'Porch_','Door_Cream_Frame','Door_Plank_Seam','Corner_Post','Entry_')):
        bpy.data.objects.remove(o,do_unlink=True)
    elif '_Wood_Frame' in o.name:bpy.data.objects.remove(o,do_unlink=True)
def roof(prefix,w,eave,peak,ya,yb,rows):
    def h(x):return peak-(peak-eave)*abs(x)/w
    for side in (-1,1):
        a,b=sorted((0,side*w))
        extrude(prefix+'_Pitched_Roof',[(a,h(a)),(b,h(b)),(b,h(b)-.065),(a,h(a)-.065)],ya,yb,green,.004)
        for i in range(rows):
            xa=a+(b-a)*i/rows+.003;xb=a+(b-a)*(i+1)/rows-.003
            for j in range(8 if w>1 else 3):
                count=8 if w>1 else 3
                y0=ya+(yb-ya)*j/count+.003;y1=ya+(yb-ya)*(j+1)/count-.003
                extrude(prefix+'_Sage_Clay_Tile',[(xa,h(xa)+.012),(xb,h(xb)+.012),(xb,h(xb)-.012),(xa,h(xa)-.012)],y0,y1,green,.005)
    for y in (ya+.006,yb-.006):
        extrude(prefix+'_Continuous_Timber_Fascia',[(-w,eave-.01),(0,peak-.01),(w,eave-.01),
            (w,eave-.085),(0,peak-.085),(-w,eave-.085)],y-.018,y+.018,wood,.004)
    for x in (-w+.022,w-.022):box(prefix+'_Side_Eave',(.065,yb-ya-.025,.07),(x,(ya+yb)/2,eave-.04),wood,.004)
    for j in range(8 if w>1 else 3):
        count=8 if w>1 else 3;y0=ya+(yb-ya)*j/count;y1=ya+(yb-ya)*(j+1)/count-.004
        p=[(.042*math.cos(math.pi*k/24),peak+.042*math.sin(math.pi*k/24)) for k in range(25)]
        extrude(prefix+'_Ridge_Cap',p,y0,y1,green,.003)
roof('Main',1.68,1.51,2.24,-1.06,1.06,8)
for ya,yb in [(-.94,-.88),(.88,.94)]:
    edge=2.24-.73*1.49/1.68-.06
    extrude('Main_Closed_Gable',[(-1.49,1.46),(1.49,1.46),(1.49,edge),(0,2.18),(-1.49,edge)],ya,yb,cream,.004)
roof('Porch',.72,1.39,1.96,-1.29,-.89,4)
extrude('Porch_Cream_Pediment',[(-.68,1.335),(.68,1.335),(0,1.90)],-1.273,-1.10,cream,.004)
box('Porch_Continuous_Header',(1.39,.16,.09),(0,-1.21,1.355),wood,.006)
for x in (-.51,.51):
    box('Porch_Grounded_Base',(.22,.24,.23),(x,-1.10,.115),cream,.012)
    box('Porch_Oak_Post',(.14,.15,1.12),(x,-1.10,.77),wood,.008)
    box('Porch_Post_Capital',(.19,.20,.055),(x,-1.10,1.305),wood,.005)
for x in (-1.43,1.43):
    for y in (-.87,.87):
        box('Corner_Oak_Post',(.10,.12,1.28),(x,y,.80),wood,.007)
        box('Corner_Grounded_Foot',(.17,.18,.22),(x,y,.11),cream,.009)
mark=bpy.data.objects['Information_Sprout_Wall_Mark'];mark.matrix_world=Matrix.Translation((0,-.105,0))@mark.matrix_world
def ring(name,cx,r,outer,base,spring,mat,front,back,parent=None):
    def p(rad,bot):return [(cx-rad,bot),(cx+rad,bot),(cx+rad,spring)]+[(cx+rad*math.cos(math.pi*i/64),spring+rad*math.sin(math.pi*i/64)) for i in range(1,65)]
    a=p(outer,base-.012);b=p(r,base);n=len(a);verts=[(x,y,z) for y in (front,back) for c in (a,b) for x,z in c];faces=[]
    for i in range(n):
        j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,mat,.004);o.parent=parent
ring('Door_Continuous_Cream_Surround',0,.285,.35,.16,.78,cream,-.99,-.92)
for x,label in [(-.99,'Front_Left'),(.99,'Front_Right')]:ring(label+'_Window_Continuous_Rebate',x,.255,.299,.47,.88,wood,-.984,-.92)
ring('Right_Side_Window_Continuous_Rebate',0,.255,.299,.47,.88,wood,-.984,-.92,bpy.data.objects['Right_Side_Window_Pivot'])
for o in s.objects:
    if o.name.endswith('_Unified_Cross'):
        for v in o.data.vertices:
            if v.co.z>1.10:v.co.z+=.019
            elif v.co.z<.49:v.co.z-=.004
# Four modest panels: curved upper pair and rectangular lower pair.
door=bpy.data.objects['Central_Wood_Door']
for side in (-1,1):
    cx=side*.115
    for z,h in [(.34,.19),(.70,.37)]:
        cutter=box('Panel_Cutter',(.150,.038,h),(cx,-.957,z),wood,.007)
        bpy.context.view_layer.objects.active=door;m=door.modifiers.new('Panel_Recess','BOOLEAN');m.operation='DIFFERENCE';m.object=cutter
        bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cutter,do_unlink=True)
        box('Door_Recessed_Panel',(.144,.008,h-.009),(cx,-.943,z),wood,.006)
        # Rounded trim as a single closed path with smooth corners.
        pts=[];w=.164;hh=h+.012;r=.009
        for x0,z0,a0 in [(w/2-r,hh/2-r,0),(-w/2+r,hh/2-r,90),(-w/2+r,-hh/2+r,180),(w/2-r,-hh/2+r,270)]:
            for i in range(13):
                a=math.radians(a0+90*i/12);pts.append((cx+x0+r*math.cos(a),-.980,z+z0+r*math.sin(a)))
        inner=[(cx+(x-cx)*.83,y,z+(zz-z)*(h-.010)/(h+.012)) for x,y,zz in pts]
        n=len(pts);verts=[(x,y0,zz) for y0 in (-.978,-.955) for poly in (pts,inner) for x,y,zz in poly];faces=[]
        for i in range(n):
            j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
        mesh=bpy.data.meshes.new('Panel_Ring');mesh.from_pydata(verts,[],faces)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('Door_Continuous_Panel_Moulding',mesh);bpy.context.collection.objects.link(obj);finish(obj,wood,.002)
handle=bpy.data.objects['Brass_Handle'];handle.location.x-=.05;handle.scale*=.72
for z in (.30,.84):box('Door_Brass_Hinge',(.009,.012,.034),(.273,-.976,z),gold,.003)
# Uniform steps form a single closed body; no projecting wooden sill.
profile=[(-.91,0),(-1.47,0),(-1.47,.08),(-1.27,.08),(-1.27,.16),(-.91,.16)]
o=extrude('Entry_Continuous_Two_Step_Solid',profile,-.75,.75,cream,.008);o.rotation_euler.z=math.pi/2
for v in door.data.vertices:
    if v.co.z<.20:v.co.z-=.045*min(1,max(0,(.20-v.co.z)/.04))
door.data.update()
wall=bpy.data.objects['Smooth_Walls_Windowless_Back']
for v in wall.data.vertices:
    p=wall.matrix_world@v.co
    if p.z<.21:
        p.z-=.080*min(1,max(0,(.21-p.z)/.06));v.co=wall.matrix_world.inverted()@p
wall.data.update()
bpy.context.view_layer.update();asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-clean.glb'),export_format='GLB',use_selection=True)
c=s.camera;s.cycles.samples=24
for name,loc,target,scale in [('front-right',(4,-6,3.5),(0,-.10,1.1),4.5),('rear',(4,6,3.5),(0,0,1.1),4.5),('entry-detail',(1,-4,2),(0,-1.1,.98),2.3)]:
    c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-redesign.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'Information-clean.glb').read_bytes()).hexdigest(),'sprout':'existing interior medallion reused'},indent=2))
