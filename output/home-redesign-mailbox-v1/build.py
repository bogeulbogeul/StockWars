"""Native home redesign and separate mailbox, placed right of the entrance."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'home-inset-door-window-v8'/'Home-inset-window.blend'))
scene=bpy.context.scene
wood=bpy.data.materials['Home_Honey_Wood'];cream=bpy.data.materials['Home_Cream_Plaster']
red=bpy.data.materials['Home_Terracotta_Tiles'];gold=bpy.data.materials['Home_Brass_Handle']
dark=bpy.data.materials['Home_Wood_Grooves']
for o in list(scene.objects):
    if o.name.startswith(('Home_Curved_Roof','Home_Continuous_Mitered_Eaves','Home_Red_Roof_Tile','Home_Red_Ridge_Tile',
        'Home_Front_Gable','Home_Back_Gable','Home_Wood_Door_Frame','Home_Front_Window_Stone_Arch',
        'Home_Front_Window_Wood_Frame','Home_Right_Window_Stone_Arch','Home_Right_Window_Wood_Frame','Home_Door_Plank_Groove')):
        bpy.data.objects.remove(o,do_unlink=True)
chimney=bpy.data.objects['Home_Smooth_Chimney'];chimney_mat=chimney.data.materials[0]
bpy.data.objects.remove(chimney,do_unlink=True)
box('Home_Smooth_Chimney',(.29,.30,.686),(.66,.35,1.743),chimney_mat,.014)
def h(x):return 2.05-.80*abs(x)/1.23
for side in (-1,1):
    a,b=sorted((0,side*1.23))
    extrude('Home_Pitched_Roof',[(a,h(a)),(b,h(b)),(b,h(b)-.06),(a,h(a)-.06)],-.96,.96,red,.005)
    for i in range(7):
        xa=a+(b-a)*i/7+.003;xb=a+(b-a)*(i+1)/7-.003
        for j in range(8):
            ya=-.96+j*1.92/8+.003;yb=ya+1.92/8-.006
            extrude('Home_Red_Clay_Tile',[(xa,h(xa)+.012),(xb,h(xb)+.012),(xb,h(xb)-.014),(xa,h(xa)-.014)],ya,yb,red,.006)
for y in (-.96,.96):
    extrude('Home_Straight_Timber_Fascia',[(-1.23,1.24),(0,2.04),(1.23,1.24),(1.23,1.17),(0,1.97),(-1.23,1.17)],y-.018,y+.018,wood,.005)
    extrude('Home_Sealed_Gable',[(-1.05,1.20),(1.05,1.20),(1.05,h(1.05)-.055),(0,1.995),(-1.05,h(1.05)-.055)],y+.10 if y<0 else y-.15,y+.15 if y<0 else y-.10,cream,.006)
for j in range(8):
    a=-.97+j*1.94/8;b=a+1.94/8-.004
    p=[(.041*math.cos(math.pi*i/24),2.05+.041*math.sin(math.pi*i/24)) for i in range(25)]
    extrude('Home_Red_Ridge_Cap',p,a,b,red,.004)
for x in (-1.205,1.205):box('Home_Timber_Side_Eave',(.07,1.90,.075),(x,0,1.205),wood,.005)
for x in (-.99,.99):
    for y in (-.78,.78):
        box('Home_Timber_Corner_Post',(.105,.115,1.17),(x,y,.675),wood,.008)
        box('Home_Grounded_Post_Foot',(.17,.18,.17),(x,y,.085),cream,.012)
for y in (-.82,.82):box('Home_Continuous_Eave_Beam',(2.08,.12,.085),(0,y,1.215),wood,.006)
def ring(name,r,outer,base,spring,mat,target,angle=0):
    def contour(rad,bot):
        return [(-rad,bot),(rad,bot),(rad,spring)]+[(rad*math.cos(math.pi*i/64),spring+rad*math.sin(math.pi*i/64)) for i in range(1,65)]
    a=contour(outer,base-.025);b=contour(r,base);n=len(a)
    verts=[(x,y,z) for y in (-.045,.018) for poly in (a,b) for x,z in poly]
    faces=[]
    for i in range(n):
        j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,mat,.004)
    o.location=target;o.rotation_euler.z=angle
ring('Home_Continuous_Wood_Door_Frame',.27,.315,.12,.76,wood,(.43,-.843,0))
ring('Home_Front_Continuous_Cream_Window',.24,.285,.41,.73,cream,(-.54,-.84,0))
ring('Home_Front_Continuous_Wood_Rebate',.225,.243,.41,.73,wood,(-.54,-.85,0))
ring('Home_Right_Continuous_Cream_Window',.182,.222,.42,.69,cream,(1.055,.05,0),math.pi/2)
ring('Home_Right_Continuous_Wood_Rebate',.17,.184,.42,.69,wood,(1.068,.05,0),math.pi/2)
# Real shallow lower door panel, clear of the existing round glass opening.
door=bpy.data.objects['Home_Arched_Wood_Door']
cutter=box('Door_Panel_Cutter',(.39,.035,.35),(.43,-.85,.395),wood,.009)
bpy.context.view_layer.objects.active=door
mod=door.modifiers.new('Lower_Panel_Recess','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
box('Home_Door_Recessed_Lower_Panel',(.378,.013,.338),(.43,-.839,.395),wood,.008)
for z in (.25,.84):box('Home_Door_Brass_Hinge',(.008,.012,.035),(.685,-.858,z),gold,.002)
# Independent mailbox asset; local origin is the post's ground contact point.
mail_start=set(scene.objects)
box('Mailbox_Grounded_Foot',(.21,.19,.055),(0,0,.0275),cream,.009)
box('Mailbox_Oak_Post',(.075,.075,.36),(0,0,.22),wood,.007)
outline=[(-.13,.36),(.13,.36),(.13,.53)]+[(.13*math.cos(math.pi*i/48),.53+.13*math.sin(math.pi*i/48)) for i in range(1,49)]
mail=extrude('Mailbox_Red_Rounded_Body',outline,-.11,.11,red,.007)
slot=box('Mailbox_Slot_Cutter',(.18,.05,.022),(0,-.11,.535),dark,.004)
bpy.context.view_layer.objects.active=mail
mod=mail.modifiers.new('True_Mail_Slot','BOOLEAN');mod.operation='DIFFERENCE';mod.object=slot
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(slot,do_unlink=True)
box('Mailbox_Dark_Slot_Recess',(.177,.008,.019),(0,-.092,.535),dark,.003)
box('Mailbox_Front_Access_Flap',(.218,.016,.139),(0,-.119,.44),red,.006)
box('Mailbox_Envelope_Emblem',(.095,.008,.063),(-.018,-.13,.443),cream,.005)
stroke('Mailbox_Envelope_Fold',[(-.060,-.135,.468),(-.018,-.135,.438),(.024,-.135,.468)],.0025,wood)
box('Mailbox_Brass_Pull',(.012,.013,.018),(.072,-.135,.444),gold,.005)
mail_objects=[o for o in scene.objects if o not in mail_start]
def export(path,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/path),export_format='GLB',use_selection=True)
export('Mailbox-right.glb',mail_objects)
mailroot=bpy.data.objects.new('Home_Right_Mailbox',None);bpy.context.collection.objects.link(mailroot)
for o in mail_objects:o.parent=mailroot
mailroot.location=(1.35,-1.075,0)
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
export('Home-with-right-mailbox.glb',asset)
export('Home-redesign.glb',[o for o in asset if o not in mail_objects and o!=mailroot])
cam=scene.camera;scene.cycles.samples=24;scene.render.resolution_x=1200;scene.render.resolution_y=1000
for name,loc,target,scale in [('front-right',(4,-6,3.5),(.08,-.08,1.05),4.15),
    ('rear',(4,6,3.5),(0,0,1.05),4.15),('mailbox-detail',(3,-4,1.7),(1.35,-1.075,.35),1.12)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Home-redesign.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'status':'3D asset created; not game installed','mailbox':'right of entrance steps',
    'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.glob('*.glb')}},indent=2))
