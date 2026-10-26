"""Continuous arched surround and recessed panel double doors."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-grand-single-v4'/'CipherSecurities-grand.blend'))
scene=bpy.context.scene
blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream']
gold=bpy.data.materials['Cipher_Satin_Brass'];glass=bpy.data.materials['Window_Muted_Blue']
dark=bpy.data.materials['Cipher_Enamel_Navy']
old=bpy.data.objects['Door_Assembly']
for o in list(old.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
bpy.data.objects.remove(old,do_unlink=True)
for o in list(scene.objects):
    if o.name.startswith('Entry_Fanlight') or o.name=='Entry_Arched_Fanlight_Glass':bpy.data.objects.remove(o,do_unlink=True)
def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o
root=empty('Door_Assembly');frame=empty('Frame',parent=root)
def parent_world(o,p):
    m=o.matrix_world.copy();o.parent=p;o.matrix_world=m;return o
spring=1.0155;r=.421;outer=.53459984;bottom=.30
def arch(radius,base):
    return [(-radius,base),(radius,base),(radius,spring)]+[
        (radius*math.cos(math.pi*i/64),spring+radius*math.sin(math.pi*i/64)) for i in range(1,65)]
# Closed annulus includes both jambs and sill; no detached spring blocks.
inner=arch(r,bottom+.012);outline=arch(outer,bottom);n=len(inner)
verts=[(x,y,z) for y in (-1.165,-.945) for p in (outline,inner) for x,z in p]
faces=[]
for i in range(n):
    j=(i+1)%n
    faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
              (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
mesh=bpy.data.meshes.new('Continuous_Entry_Frame');mesh.from_pydata(verts,[],faces)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
o=bpy.data.objects.new('Door_Continuous_Arch_Frame',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.008);parent_world(o,frame)
# Inner navy rebate and brass bead reinforce the depth around the fanlight.
pts=[(x,-1.171,z) for x,z in arch(.446,bottom+.022)]
parent_world(stroke('Door_Inner_Brass_Bead',pts+[pts[0]],.004,gold),frame)
fan=[(-r,spring),(r,spring)]+[(r*math.cos(math.pi*i/64),spring+r*math.sin(math.pi*i/64)) for i in range(1,65)]
parent_world(extrude('Door_Fanlight_Glass',fan,-1.119,-1.087,glass,.003),frame)
parent_world(stroke('Door_Fanlight_Arch',[(r*math.cos(math.pi*i/64),-1.13,spring+r*math.sin(math.pi*i/64)) for i in range(65)],.008,gold),frame)
parent_world(box('Door_Fanlight_Transom',(.85,.075,.033),(0,-1.126,spring),cream,.005),frame)
for a in (math.pi/4,math.pi/2,3*math.pi/4):
    parent_world(stroke('Door_Fanlight_Radial',[(0,-1.133,spring),(r*math.cos(a),-1.133,spring+r*math.sin(a))],.006,gold),frame)
parent_world(stroke('Door_Fanlight_Inner_Arc',[(.18*math.cos(math.pi*i/48),-1.134,spring+.18*math.sin(math.pi*i/48)) for i in range(49)],.005,gold),frame)
for side,label in [(-1,'Left'),(1,'Right')]:
    hinge=empty('Hinge_'+label,(side*r,-1.05,bottom),root)
    cx=side*.2135
    leaf=box('Door_Panel_Leaf_'+label,(.412,.095,.692),(cx,-1.070,.658),blue,.004)
    # Recessed panels are cut into each leaf, not drawn on top of a flat slab.
    for z,h in [(.451,.157),(.751,.321)]:
        cutter=box('Panel_Cutter',(.279,.045,h),(cx,-1.115,z),dark,.007)
        bpy.context.view_layer.objects.active=leaf
        mod=leaf.modifiers.new('Recessed_Panel','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        parent_world(box('Door_Recessed_Panel_Inset',(.271,.012,h-.008),(cx,-1.099,z),dark,.007),hinge)
        # Continuous fine moulding seated at the edge of each recess.
        w=.294;hh=h+.014;rr=.010;pts=[]
        for x0,z0,start in [(w/2-rr,hh/2-rr,0),(-w/2+rr,hh/2-rr,90),(-w/2+rr,-hh/2+rr,180),(w/2-rr,-hh/2+rr,270)]:
            for i in range(13):
                a=math.radians(start+90*i/12);pts.append((cx+x0+rr*math.cos(a),-1.122,z+z0+rr*math.sin(a)))
        parent_world(stroke('Door_Panel_Continuous_Moulding',pts+[pts[0]],.0045,blue),hinge)
    parent_world(leaf,hinge)
    hx=side*.055
    for z in (.680,.825):
        parent_world(box('Door_Brass_Pull_Mount',(.025,.022,.029),(hx,-1.129,z),gold,.006),hinge)
    parent_world(stroke('Door_Brass_Curved_Pull',[(hx,-1.143,.680),(hx,-1.165,.695),
        (hx,-1.17,.710),(hx,-1.17,.795),(hx,-1.165,.810),(hx,-1.143,.825)],.009,gold),hinge)
    parent_world(box('Door_Brass_Kick_Plate',(.31,.006,.036),(cx,-1.121,.343),gold,.005),hinge)
    for z in (.42,.88):
        parent_world(box('Door_Brass_Hinge',(.012,.018,.045),(side*.409,-1.12,z),gold,.003),hinge)
scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
cam=scene.camera;scene.cycles.samples=32
for name,loc,target,scale in [('door-detail',(1,-4,1.8),(0,-1.10,.92),2.20),
    ('front-right',(5,-9,4.6),(0,-.18,1.40),7.6)]:
    cam.location=loc;cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-door-detail.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'source':'cipher-grand-single-v4','preserved':['Clock_Hour','Clock_Minute','Hinge_Left','Hinge_Right']},indent=2))
