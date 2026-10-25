"""Build the twelve current Vivian products as editable native meshes."""
import bpy, math, random, json, hashlib, base64, re
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
random.seed(25)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color, rough=.7):
    color=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color)
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
    return m
cream=mat('Cream paper',(1,.82,.53)); ivory=mat('Ivory label',(1,.94,.76))
gold=mat('Honey gold',(1,.48,.035),.38); breadmat=mat('Golden baked crust',(.82,.275,.025),.5)
green=mat('Forest green',(.19,.34,.085)); lightgreen=mat('Sage green',(.48,.65,.22))
pink=mat('Petal pink',(.93,.27,.37)); pale=mat('Pink paper',(1,.55,.59))
berry=mat('Berry red',(.68,.045,.17),.35); purple=mat('Lavender packet',(.49,.28,.65))
lilac=mat('Moon crystals',(.79,.65,.95),.4); aqua=mat('Dew turquoise',(.10,.76,.75),.28)
brown=mat('Warm brown',(.34,.18,.07)); white=mat('Crystal glints',(1,.96,.83),.35)
biscuit=mat('Golden biscuit',(.98,.66,.22),.6)
def finish(o,name,m):
    o.name=name; o.data.materials.append(m); return o
def box(name,loc,size,m,bev=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bev:
        b=o.modifiers.new('Rounded paper edges','BEVEL'); b.width=bev; b.segments=3
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=b.name)
        w=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=w.name)
    return finish(o,name,m)
def ell(name,loc,size,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=loc)
    o=bpy.context.object; o.scale=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for p in o.data.polygons:p.use_smooth=True
    return finish(o,name,m)
def mesh(name,verts,faces,m):
    d=bpy.data.meshes.new(name); d.from_pydata(verts,[],faces); d.update()
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o); return finish(o,name,m)
def lathe(name,profile,m,n=48,flutes=0):
    v=[]
    for z,r in profile:
        for i in range(n):
            a=2*math.pi*i/n; rr=r*(1+flutes*math.cos(a*16)); v.append((rr*math.cos(a),rr*math.sin(a),z))
    f=[tuple(range(n-1,-1,-1))]
    for j in range(len(profile)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    f.append(tuple((len(profile)-1)*n+i for i in range(n)))
    o=mesh(name,v,f,m)
    for p in o.data.polygons:p.use_smooth=True
    return o
def line(name,points,r,m):
    d=bpy.data.curves.new(name,'CURVE'); d.dimensions='3D'; d.bevel_depth=r; d.bevel_resolution=3
    p=d.splines.new('POLY'); p.points.add(len(points)-1)
    for v,co in zip(p.points,points):v.co=(*co,1)
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def flower(x,y,z,r,m=pink):
    for i in range(5):
        a=i*math.tau/5; ell('Flower petal',(x+r*.54*math.sin(a),y,z+r*.54*math.cos(a)),(r*.43,.025,r*.43),m)
    ell('Flower heart',(x,y-.018,z),(r*.26,.028,r*.26),gold)
def leaves(x,y,z,s=.2,m=green):
    line('Leaf stem',[(x-s*.3,y,z-s*.4),(x+s*.3,y,z+s*.7)],.012,m)
    for dx,dz,a in [(-.25,.1,-.6),(.25,.4,.6)]:
        o=ell('Leaf',(x+dx*s,y-.012,z+dz*s),(s*.19,.025,s*.35),m);o.rotation_euler[1]=a
def label(w,h,y,z):return box('Raised cream label',(0,y,z),(w,.025,h),ivory,.07)
def tray(w,d,h):
    box('Paper tray floor',(0,0,.035),(w,d,.07),cream,.025)
    box('Paper tray front',(0,-d/2,h/2),(w,.05,h),cream,.02)
    box('Paper tray back',(0,d/2,h/2),(w,.05,h),cream,.02)
    for x in [-w/2,w/2]:box('Paper tray side',(x,0,h/2),(.05,d,h),cream,.02)
    flower(-w*.14,-d/2-.035,h*.52,h*.29,gold);leaves(w*.20,-d/2-.035,h*.47,h*.7)
def packet(m,w=.9,h=1.25):
    # A hollow, tapered four-sided paper pouch; inner rim is explicit geometry.
    rings=[(0,w*.55,.30),(h*.85,w*.46,.23),(h,w*.43,.22),(h,w*.43-.035,.185),(h*.76,w*.42,.18)]
    v=[]
    for z,x,y in rings:v.extend([(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)])
    f=[(3,2,1,0)]
    for j in range(4):
        for i in range(4):f.append((j*4+i,j*4+(i+1)%4,(j+1)*4+(i+1)%4,(j+1)*4+i))
    mesh('Folded open paper pouch',v,f,m)
    o=label(w*.88,h*.53,-.276,h*.43)
    if m==purple:o.data.materials.clear();o.data.materials.append(purple)
    for x in [-w*.53,w*.53]:line('Fold seam',[(x,-.295,.05),(x*.80,-.225,h)],.012,cream)
    for i in range(100):
        x=random.uniform(-w*.35,w*.35);y=random.uniform(-.15,.15)
        z=h*.87+.13*max(0,1-(x/(w*.4))**2-(y/.22)**2)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.025,.045),location=(x,y,z))
        finish(bpy.context.object,'Loose powder crystal',gold if m==cream else lilac)
def star(y,z):
    pts=[]
    for i in range(8):
        a=i*math.pi/4;r=.26 if i%2==0 else .075;pts.append((r*math.sin(a),y,z+r*math.cos(a)))
    mesh('Four point star',pts,[tuple(range(8))],gold)
def crescent(y,z):
    # Closed crescent silhouette, no overlaid disc hiding the subtraction.
    pts=[]
    for i in range(33):
        a=math.pi/2+math.pi*i/32;pts.append((.22*math.cos(a),y,z+.22*math.sin(a)))
    for i in range(1,33):
        a=-math.pi/2-math.pi*i/32;pts.append((.11+.245*math.cos(a),y,z+.22*math.sin(a)))
    mesh('Cream crescent',pts,[tuple(range(len(pts)))],ivory)
def bottle(isberry):
    if isberry:
        lathe('Round berry bottle',[(0,.24),(.05,.33),(.2,.43),(.55,.47),(.78,.33),(.92,.19),(1.02,.19)],berry)
        capz=1.05;r=.23;ly=-.445;lz=.43
        lathe('Gathered green neck wrap',[(.88,.24),(.92,.27),(.98,.20)],lightgreen,64,.12)
    else:
        lathe('Tall apple bottle',[(0,.18),(.04,.22),(.83,.22),(1.06,.13),(1.18,.13)],gold)
        capz=1.22;r=.17;ly=-.222;lz=.55
    lathe('Green screw cap',[(capz-.06,r),(capz+.05,r),(capz+.07,r*.92)],green,48,.025)
    lathe('Gold neck ring',[(capz-.10,r*.97),(capz-.075,r*.97)],gold)
    label(.53 if isberry else .35,.50 if isberry else .58,ly,lz)
    if isberry:
        for dx,dz in [(-.09,.01),(0,-.09),(.09,.01),(0,.10),(0,.01)]:ell('Berry fruit',(dx,ly-.055,lz+dz),(.075,.045,.075),pink)
    else:
        for x in [-.045,.045]:ell('Apple fruit',(x,ly-.045,lz),(.09,.035,.115),berry)
    leaves(.03,ly-.06,lz+.16,.18)
def cookie(x,y,z):
    ell('Cookie base',(x,y,z),(.23,.23,.065),gold)
    for i in range(6):
        a=math.tau*i/6;ell('Cookie scallop',(x+.16*math.cos(a),y+.16*math.sin(a),z),(.105,.105,.065),biscuit)
    for i in range(5):
        a=math.tau*i/5;ell('Honey flower glaze',(x+.08*math.cos(a),y+.08*math.sin(a),z+.058),(.065,.065,.018),gold)
    ell('Honey center',(x,y,z+.07),(.045,.045,.02),gold)
def paper_texture(which):
    source=ROOT/'web/assets/items/paper-v4'/f'{which}.svg'
    raw=source.read_text(encoding='utf8');data=base64.b64decode(re.search(r'base64,([^"\s]+)',raw).group(1))
    dest=OUT/f'{which}-print-source.png';dest.write_bytes(data)
    im=bpy.data.images.load(str(dest));im.pack()
    m=mat(which+' printed paper',(1,1,1));p=m.node_tree.nodes.get('Principled BSDF');t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=im
    m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    m.node_tree.links.new(t.outputs['Alpha'],p.inputs['Alpha'])
    vb=[float(v) for v in re.search(r'viewBox="([^"]+)"',raw).group(1).split()]
    x,y,w,h=vb; iw,ih=im.size
    return m,[(x/iw,1-(y+h)/ih),((x+w)/iw,1-(y+h)/ih),((x+w)/iw,1-y/ih),(x/iw,1-y/ih)]
def paper(which):
    w=1.65;h=.89
    box('Solid paper body',(0,0,h/2),(w,.055,h),ivory,.035)
    m,uv=paper_texture(which)
    o=mesh('Original approved printed face',[(-w/2,-.03,0),(w/2,-.03,0),(w/2,-.03,h),(-w/2,-.03,h)],[(0,1,2,3)],m)
    layer=o.data.uv_layers.new()
    for i,co in enumerate(uv):layer.data[i].uv=co
    if which=='sealed-news':
        mesh('Back envelope fold',[(-.77,.031,.84),(.77,.031,.84),(0,.031,.35)],[(0,1,2)],cream)
        o=ell('Raised green wax seal',(0,-.055,.42),(.20,.035,.20),green);leaves(0,-.093,.40,.24,lightgreen)
    else:
        # Shallow notches cut into both short edges of the actual paper mesh.
        target=bpy.data.objects.get('Solid paper body')
        for x in [-w/2,w/2]:
            for z in [.15,.29,.43,.57,.71]:
                bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.026,depth=.2,location=(x,0,z),rotation=(math.pi/2,0,0))
                cutter=bpy.context.object;mod=target.modifiers.new('Ticket edge notch','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
                bpy.context.view_layer.objects.active=target;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
catalog=[('honey_cookie','꿀 쿠키'),('petal_tea','꽃잎 차'),('apple_juice','사과 주스'),('popori_bread','포포리빵'),('berry_juice','꽃꿀 베리 주스'),('herb_tea','허브 차'),('dew_jelly','이슬 젤리'),('honey_candy','꽃꿀 사탕'),('crypto_decoder','별가루'),('moon_powder','달가루'),('lotto_ticket','로또'),('premium_rumor','봉인된 소식 봉투')]
products=[]; manifest=[]
for index,(key,title) in enumerate(catalog):
    before=set(bpy.data.objects)
    if key=='honey_cookie':
        tray(1.15,1.05,.27)
        for x in [-.265,.265]:
            for y in [-.24,.24]:cookie(x,y,.28)
    elif key=='petal_tea':
        box('Pink tea carton',(0,0,.44),(.90,.62,.88),pale)
        mesh('Gabled carton closure',[(-.45,-.31,.86),(.45,-.31,.86),(-.45,0,1.19),(.45,0,1.19),(-.45,.31,.86),(.45,.31,.86)],[(0,1,3,2),(2,3,5,4),(0,2,4),(1,5,3)],pink)
        box('Sealed top fold',(0,0,1.19),(.89,.045,.06),pale,.015)
        label(.73,.59,-.325,.44);flower(0,-.36,.47,.21);leaves(.10,-.36,.62,.28)
        flower(0,-.08,1.05,.12,ivory)
    elif key in ['apple_juice','berry_juice']:bottle(key=='berry_juice')
    elif key=='popori_bread':
        tray(1.65,.65,.25)
        o=lathe('Whole uncut tapered loaf',[(0,0),(.06,.15),(.20,.25),(.45,.29),(.85,.28),(1.20,.24),(1.43,.17),(1.55,.05),(1.58,0)],breadmat)
        o.rotation_euler[1]=math.pi/2;o.location=(-.79,0,.32)
    elif key=='herb_tea':
        box('Herb tea box',(0,0,.32),(1.25,.52,.64),lightgreen)
        label(1.08,.44,-.273,.31);leaves(0,-.301,.31,.45)
        mesh('Envelope lid fold',[(-.60,-.27,.66),(.60,-.27,.66),(0,-.29,.54)],[(0,1,2)],green)
        for x in [-.42,.42]:leaves(x,-.30,.28,.23,lightgreen)
    elif key=='dew_jelly':
        lathe('Pleated cream paper cup',[(0,.25),(.05,.30),(.22,.47),(.26,.49),(.28,.47),(.09,.28)],ivory,96,.035)
        lathe('Teardrop jelly',[(.10,.10),(.17,.29),(.28,.33),(.44,.30),(.62,.22),(.80,.11),(.91,.025),(.93,0)],aqua,48)
    elif key=='honey_candy':
        ell('Cream candy wrapper',(0,0,.27),(.38,.22,.25),ivory);flower(0,-.228,.28,.19,gold)
        for s in [-1,1]:
            o=lathe('Twisted gold wrapper',[(0,.09),(.08,.07),(.30,.27),(.35,.24)],gold,32,.10)
            o.rotation_euler[1]=s*math.pi/2;o.location=(s*.32,0,.27)
    elif key in ['crypto_decoder','moon_powder']:
        packet(cream if key=='crypto_decoder' else purple)
        if key=='crypto_decoder':star(-.297,.54)
        else:crescent(-.297,.54)
        for x in [-.30,.30]:leaves(x,-.30,.30,.20,gold if key=='crypto_decoder' else ivory)
    elif key in ['lotto_ticket','premium_rumor']:paper('lotto' if key=='lotto_ticket' else 'sealed-news')
    objects=list(set(bpy.data.objects)-before)
    root=bpy.data.objects.new('item_'+key,None);bpy.context.collection.objects.link(root)
    for o in objects:o.parent=root
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects+[root]:o.select_set(True)
    path=OUT/f'item_{key}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True)
    tris=sum(len(p.vertices)-2 for o in objects if o.type=='MESH' for p in o.data.polygons)
    manifest.append(dict(id='item_'+key,name=title,file=path.name,triangles=tris,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    root.location=((index%4-1.5)*2.15,0,(2-index//4)*1.85)
    products.append(root)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
# Reproducible gallery lighting, actual geometry, no image stand-ins.
floor=mat('Studio background',(.88,.86,.79));box('Studio floor',(0,1,-.13),(200,200,.1),floor,.0)
world=bpy.context.scene.world;world.color=(.35,.35,.35)
for loc,power,size in [((-4,-7,10),1400,7),((7,-3,6),900,6),((1,5,9),1600,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-15,9));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,2.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=9.4
s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=32
s.render.resolution_x=1800;s.render.resolution_y=1250;s.render.resolution_percentage=100
s.view_settings.view_transform='AgX';s.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Shop-items.blend'))
s.render.filepath=str(OUT/'preview.png');bpy.ops.render.render(write_still=True)
print('FINISHED',len(products),'PRODUCTS')
