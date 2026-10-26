"""Adopted coral general-store redesign, native geometry."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,finish,arch_outline
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-exterior-inset-v2'/'VivianStore-clean.blend'))
scene=bpy.context.scene
wood=bpy.data.materials['Vivian_Honey_Wood'];coral=bpy.data.materials['Vivian_Coral']
cream=bpy.data.materials['Vivian_Cream'];ivory=bpy.data.materials['Vivian_Awning_Cream'];gold=bpy.data.materials['Vivian_Gold']
for o in list(scene.objects):
    if o.name.startswith(('Sealed_Coral_Roof','Continuous_Wood_Eaves','Broad_Coral_Roof_Tile','Front_Gable','Rear_Gable','Door_Frame','Door_Lower_Plank','Brass_Knob','Entry_Step_')):
        bpy.data.objects.remove(o,do_unlink=True)
    elif o.name.startswith(('Left_Display_Frame','Right_Display_Frame')):
        bpy.data.objects.remove(o,do_unlink=True)
def height(x):return 2.23-.70*abs(x)/1.47
for side in (-1,1):
    a,b=sorted((0,side*1.47))
    extrude('Pitched_Coral_Roof',[(a,height(a)),(b,height(b)),(b,height(b)-.065),(a,height(a)-.065)],-1.04,1.04,coral,.005)
    for i in range(7):
        xa=a+(b-a)*i/7+.003;xb=a+(b-a)*(i+1)/7-.003
        for j in range(8):
            ya=-1.04+j*2.08/8+.004;yb=-1.04+(j+1)*2.08/8-.004
            extrude('Coral_Clay_Roof_Tile',[(xa,height(xa)+.016),(xb,height(xb)+.016),(xb,height(xb)-.014),(xa,height(xa)-.014)],ya,yb,coral,.007)
for y in (-1.04,1.04):
    extrude('Straight_Timber_Roof_Fascia',[(-1.47,1.52),(0,2.22),(1.47,1.52),(1.47,1.435),(0,2.135),(-1.47,1.435)],y-.022,y+.022,wood,.006)
    ya,yb=(-.93,-.86) if y<0 else (.86,.93)
    extrude('Sealed_Cream_Gable',[(-1.28,1.47),(1.28,1.47),(1.28,height(1.28)-.06),(0,2.17),(-1.28,height(1.28)-.06)],ya,yb,cream,.004)
for x in (-1.445,1.445):box('Timber_Side_Eave',(.07,2.06,.085),(x,0,1.475),wood,.006)
for j in range(8):
    a=-1.05+j*2.10/8;b=a+2.10/8-.004
    p=[(.044*math.cos(math.pi*i/24),2.23+.044*math.sin(math.pi*i/24)) for i in range(25)]
    extrude('Coral_Ridge_Cap',p,a,b,coral,.003)
for x in (-1.235,1.235):
    for y in (-.88,.88):
        box('Timber_Corner_Post',(.11,.14,1.34),(x,y,.80),wood,.008)
        box('Grounded_Cream_Post_Foot',(.22,.22,.22),(x,y,.11),cream,.012)
        box('Timber_Post_Base_Bead',(.13,.16,.035),(x,y,.2375),wood,.004)
# Continuous annular arch surround, with closed jamb and bottom edges.
def ring(name,cx,r,outer,base,spring,front,back):
    def contour(rad,z):return [(cx-rad,z),(cx+rad,z),(cx+rad,spring)]+[(cx+rad*math.cos(math.pi*i/64),spring+rad*math.sin(math.pi*i/64)) for i in range(1,65)]
    a=contour(outer,base-.012);b=contour(r,base);n=len(a)
    verts=[(x,y,z) for y in (front,back) for p in (a,b) for x,z in p];faces=[]
    for i in range(n):
        j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,wood,.005)
ring('Door_Continuous_Arch_Frame',0,.245,.29,.15,.74,-.995,-.92)
for x,label in [(-.82,'Left'),(.82,'Right')]:
    ring(label+'_Display_Continuous_Frame',x,.30,.355,.46,.90,-1.002,-.92)
def recess(obj,cx,z,w,h,name):
    # Cut into the front, then line the cavity with an inset and fine raised bead.
    cut=box('Panel_Cutter',(w,.045,h),(cx,-.978,z),wood,.006)
    bpy.context.view_layer.objects.active=obj
    m=obj.modifiers.new('Actual_Panel_Recess','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
    bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
    box(name+'_Inset',(w-.01,.008,h-.01),(cx,-.959,z),wood,.005)
    pts=[(cx-w/2,-.999,z-h/2),(cx+w/2,-.999,z-h/2),(cx+w/2,-.999,z+h/2),(cx-w/2,-.999,z+h/2)]
    stroke(name+'_Moulding',pts+[pts[0]],.004,wood)
recess(bpy.data.objects['Central_Arched_Wood_Door'],0,.345,.32,.29,'Door_Lower_Panel')
for x,label in [(-.82,'Left'),(.82,'Right')]:
    recess(bpy.data.objects[label+'_Display_Lower_Panel'],x,.285,.51,.14,label+'_Display_Decorative_Panel')
for z in (.38,.53):box('Door_Brass_Pull_Mount',(.020,.020,.023),(-.185,-1.005,z),gold,.005)
stroke('Door_Brass_Curved_Pull',[(-.185,-1.015,.38),(-.185,-1.045,.397),(-.185,-1.05,.51),(-.185,-1.015,.53)],.008,gold)
for z in (.23,.65):box('Door_Brass_Hinge',(.008,.015,.035),(.235,-.996,z),gold,.003)
# Raised flower plaque with clean closed arch silhouette; original petals reused.
plaque=[(-.25,1.58),(.25,1.58),(.25,1.84),(.21,1.84)]+[(.21*math.cos(math.pi*i/48),1.84+.21*math.sin(math.pi*i/48)) for i in range(1,49)]+[(-.25,1.84)]
extrude('Flower_Plaque_Wood_Mount',plaque,-.978,-.93,wood,.006)
inner=[(x*.92,1.80+(z-1.80)*.90) for x,z in plaque]
extrude('Flower_Plaque_Cream_Inset',inner,-.990,-.976,ivory,.004)
fit=Matrix.Translation((0,-1.0,1.82)) @ Matrix.Diagonal((.82,1,.82,1)) @ Matrix.Translation((0,1.0,-1.82))
for o in scene.objects:
    if o.name.startswith(('Flower_Petal','Flower_Leaf','Flower_Gold_Center')):o.matrix_world=fit @ o.matrix_world
# Two equal rises, one closed solid; landing remains at door-bottom height.
profile=[(-.91,0),(-1.33,0),(-1.33,.075),(-1.14,.075),(-1.14,.15),(-.91,.15)]
stairs=extrude('Entry_Continuous_Two_Step_Solid',profile,-.43,.43,cream,.008);stairs.rotation_euler.z=math.pi/2
box('Door_Flush_Threshold',(.50,.14,.022),(0,-1.00,.145),wood,.003)
scene.frame_set(1);bpy.context.view_layer.update()
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
cam=scene.camera;scene.cycles.samples=24
scene.render.resolution_x=1200;scene.render.resolution_y=1000
for name,loc,target,scale in [('front-right',(4,-6,3.5),(0,-.08,1.10),4.25),('rear',(4,6,3.5),(0,0,1.10),4.25),
    ('door-window-detail',(1,-4,2),(0,-.98,.70),2.0),('roof-sign-detail',(2,-4,3),(0,-.9,1.88),2.3)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-redesign.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest(),
    'source':'vivian-exterior-inset-v2','style':'adopted coral gable, awning, flower plaque and panelled storefront'},indent=2))
