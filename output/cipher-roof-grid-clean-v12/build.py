"""Reference roof: long horizontal wing ridges and clean central gable."""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
sys.path.insert(0, str(ROOT.parent / 'cipher-grand-single-v4'))
from exterior_geometry import box, extrude, stroke, finish
from roof import clip, slab as original_slab
sys.path.insert(0,str(ROOT))
from polygon_finish import merge_polygons,tile_slab

TILE_THICKNESS=.018
TILE_RELIEF=.009
tile_thickness_checks=[]
def slab(name,poly,h,mat,offset=0,thick=.045):
    if 'Tile' not in name:
        return original_slab(name,poly,h,mat,offset,thick)
    if len(poly)<3:return
    area=abs(sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1])))
    if area<1e-8:return
    # A shared physical thickness, measured PERPENDICULAR to each roof plane.
    x=sum(p[0] for p in poly)/len(poly);y=sum(p[1] for p in poly)/len(poly)
    e=.00001
    gx=(h(x+e,y)-h(x-e,y))/(2*e)
    gy=(h(x,y+e)-h(x,y-e))/(2*e)
    normal=Vector((-gx,-gy,1)).normalized()
    tile_slab(name,poly,h,mat,TILE_RELIEF/normal.z,TILE_THICKNESS/normal.z)
    obj=bpy.context.view_layer.objects.active
    distances=[v.co.dot(normal) for v in obj.data.vertices]
    measured=max(distances)-min(distances)
    assert abs(measured-TILE_THICKNESS)<.000002,(obj.name,measured)
    tile_thickness_checks.append({'name':obj.name,'normalThickness':measured})

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'cipher-joints-ground-v6' / 'CipherSecurities-clean-joints.blend'))
scene = bpy.context.scene
blue = bpy.data.materials['Roof_Blue']
TILE=.24
TILE_WIDTH=.28
TILE_DEPTH=.20
GAP=.005
def steps(lo,hi,step):
    value=lo
    while value<hi-1e-7:
        yield value,min(value+step,hi)
        value+=step

def caps(name,start,end,radius,height=.035,seat=.025,segment=True):
    """Identical rounded barrel segments along horizontal and inclined ridges."""
    start,end=Vector(start)+Vector((0,0,.014)),Vector(end)+Vector((0,0,.014))
    axis=(end-start).normalized();length=(end-start).length
    up=(Vector((0,0,1))-axis*axis.z).normalized()
    across=axis.cross(up).normalized()
    objects=[]
    for lo,hi in steps(0,length,TILE if segment else length):
        a=start+axis*(lo+(.0015 if segment else 0))
        b=start+axis*(hi-(.0015 if segment else 0))
        profile=[across*(radius*math.cos(math.pi*j/32))+up*((height+seat)*math.sin(math.pi*j/32)-seat) for j in range(33)]
        profile.append(up*(-.012))
        verts=[tuple(p+v) for p in (a,b) for v in profile]
        n=len(profile)
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[face[::-1] for face in faces]);mesh.update()
        obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
        finish(obj,blue,.003)
        objects.append(obj)
    return objects

def hip_point(side,sy,t):
    return Vector((side*(2.53+.60*t),sy*1.08*t,2.382-.43*t))

def junction(side):
    # Three short solid branches overlap, then become one closed junction mesh.
    pieces=caps('Wing_Threeway_Junction',(side*2.415,0,2.382),(side*2.565,0,2.382),.073,.031,.030,False)
    for sy in (-1,1):
        pieces+=caps('Wing_Threeway_Junction',hip_point(side,sy,-.025),hip_point(side,sy,.115),.064,.030,.028,False)
    base=pieces[0]
    for branch in pieces[1:]:
        bpy.context.view_layer.objects.active=base
        modifier=base.modifiers.new('Closed_Threeway_Union','BOOLEAN')
        modifier.operation='UNION';modifier.solver='EXACT';modifier.object=branch
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(branch,do_unlink=True)
    base.name='Wing_Closed_Threeway_Junction'
    bpy.context.view_layer.objects.active=base
    modifier=base.modifiers.new('Smooth_Continuous_Junction','REMESH')
    modifier.mode='VOXEL';modifier.voxel_size=.004
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    modifier=base.modifiers.new('Junction_Surface_Polish','SMOOTH')
    modifier.factor=.45;modifier.iterations=3
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in base.data.polygons:polygon.use_smooth=True
for obj in list(scene.objects):
    if obj.name.startswith(('Wing_Hip_Roof', 'Blue_Clay_Roof_Tile_Wing', 'Wing_Hip_Sealed_Cap', 'Wing_Blue_Eave', 'Central_Ridge_Cap', 'Central_Pitched_Roof', 'Blue_Clay_Roof_Tile_Central', 'Central_Sealed_Side_Cornice', 'Central_Blue_Straight_Eave')):
        bpy.data.objects.remove(obj, do_unlink=True)

for side in (-1, 1):
    # Ridge runs from the central roof to the outer hip, rather than a pyramid.
    planes = [lambda u,y: 2.38-.43*y/1.08,
              lambda u,y: 2.38+.43*y/1.08,
              lambda u,y: 2.38-.43*(u-2.53)/.60]
    rect = [(.90,-1.08),(3.13,-1.08),(3.13,1.08),(.90,1.08)]
    for k, height in enumerate(planes):
        limits = [lambda u,y,g=g,h=height:g(u,y)-h(u,y) for g in planes if g != height]
        def emit(name, polygon, offset=0, thick=.045):
            for fn in limits:
                polygon = clip(polygon, fn)
            # Split the union into linear regions; never clip with a nonlinear max.
            parts=[]
            for inside in (True, False):
                p=clip(polygon, lambda u,y:1.17-u if inside else u-1.17)
                if inside:
                    p=clip(p, lambda u,y:height(u,y)-(2.99-.75*u/1.17)-.006)
                parts.append([(side*u,y) for u,y in p])
            for polygon in merge_polygons(parts):
                slab(name,polygon,lambda x,y:height(abs(x),y),blue,offset,thick)
        emit('Wing_Long_Hip_Roof', rect[:])
        du=TILE_DEPTH/math.sqrt(1+(.43/.60)**2) if k==2 else TILE_WIDTH
        dy=TILE_WIDTH if k==2 else TILE_DEPTH/math.sqrt(1+(.43/1.08)**2)
        gu=GAP/math.sqrt(1+(.43/.60)**2) if k==2 else GAP
        gy=GAP if k==2 else GAP/math.sqrt(1+(.43/1.08)**2)
        # Start each slope at its eave; rows follow that eave exactly.
        for ua,ub in steps(3.13-math.ceil((3.13-.90)/du)*du,3.13,du):
            for ya,yb in steps(-1.08,1.08,dy):
                emit('Wing_Reference_Tile', [(ua+gu/2,ya+gy/2),(ub-gu/2,ya+gy/2),
                     (ub-gu/2,yb-gy/2),(ua+gu/2,yb-gy/2)], .012,.023)
    # Segmented half-round ridge caps, aligned with the front facade.
    caps('Wing_Horizontal_Ridge_Cap',(side*.94,0,2.382),(side*2.416,0,2.382),.073,.031,.030)
    for sy in (-1,1):
        caps('Wing_Outer_Hip_Cap',hip_point(side,sy,.113),hip_point(side,sy,1),.064,.030,.028)
        box('Wing_Blue_Eave',(1.97,.042,.065),(side*2.145,sy*1.08,1.91),blue,.005)
    box('Wing_Blue_Eave',(.042,2.16,.065),(side*3.13,0,1.91),blue,.005)
    junction(side)

# Rebuild central planes and tiles, cutting BOTH roofs at the shared intersection.
cream=bpy.data.materials['Trim_Cream']
for side in (-1,1):
    def central_height(x,y):return 2.99-.75*abs(x)/1.17
    def central_emit(name,poly,offset=0,thick=.065):
        parts=[]
        for ya,yb in [(-1.49,-1.08),(-1.08,0),(0,1.08),(1.08,1.09)]:
            p=clip(clip(poly,lambda x,y:y-ya),lambda x,y:yb-y)
            if ya>=-1.08 and yb<=1.08:
                sign=-1 if yb<=0 else 1
                p=clip(p,lambda x,y:central_height(x,y)-(2.38-.43*sign*y/1.08)-.006)
            parts.append(p)
        for polygon in merge_polygons(parts):
            slab(name,polygon,central_height,blue,offset,thick)
    a,b=sorted((0,side*1.17))
    central_emit('Central_Junction_Cut_Roof',[(a,-1.49),(b,-1.49),(b,1.09),(a,1.09)])
    for xa,xb in steps(a,b,TILE_DEPTH/math.sqrt(1+(.75/1.17)**2)):
        xa+=GAP/(2*math.sqrt(1+(.75/1.17)**2));xb-=GAP/(2*math.sqrt(1+(.75/1.17)**2))
        for ya,yb in steps(-1.49,1.09,TILE_WIDTH):
            ya+=GAP/2;yb-=GAP/2
            central_emit('Central_Junction_Cut_Tile',[(xa,ya),(xb,ya),(xb,yb),(xa,yb)],.012,.023)
    for ya,yb in [(-1.46,-.37),(.37,1.06)]:
        box('Central_Trimmed_Side_Cornice',(.095,yb-ya,.12),(side*1.10,(ya+yb)/2,2.16),cream,.005)
        box('Central_Trimmed_Blue_Eave',(.044,yb-ya,.062),(side*1.165,(ya+yb)/2,2.215),blue,.004)
    # Consistent narrow seam follows the actual straight intersection on each slope.
    for sy in (-1,1):
        y=sy*.36
        x0=(2.99-2.38)*1.17/.75
        x1=(2.99-(2.38-.43*abs(y)/1.08))*1.17/.75
        polygon=[(side*(x0-.010),0),(side*(x0+.020),0),
                 (side*(x1+.020),y),(side*(x1-.010),y)]
        slab('Roof_Exact_Intersection_Seam',polygon,
             lambda x,y:2.38-.43*abs(y)/1.08,blue,.019,.022)

caps('Central_Ridge_Cap',(0,-1.49,2.991),(0,1.09,2.991),.085,.039,.055)

scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [
    ('front-right',(5,-9,4.6),(0,-.18,1.4),7.6),
    ('front',(0,-10,4.3),(0,-.2,1.5),7.1),
    ('rear',(5,9,4.6),(0,0,1.4),7.6),
    ('roof-detail',(4,-10,3.48),(0,-.05,2.43),6.7),
    ('reference-angle',(4,-10,3.48),(0,-.05,2.43),6.7),
    ('junction-close',(4,-5,4.5),(1.05,-.1,2.38),1.65),
    ('ridge-close',(3,-4,4),(2.5,0,2.25),1.8),
    ('central-close',(4.4,-10.1,3.65),(.4,-.1,2.6),3.1)]:
    cam.location=loc;cam.data.ortho_scale=scale
    scene.render.resolution_x=1536 if name=='reference-angle' else 1200
    scene.render.resolution_y=576 if name=='reference-angle' else 800
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-roof-reference.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'wingRidgeOuterX':2.53,'wingRidgeZ':2.38,'surfaceTileWidth':TILE_WIDTH,
    'surfaceTileDepth':TILE_DEPTH,'tileGap':GAP,
    'edgeTiles':'clipped to roof boundaries','gameApplied':False},indent=2))
(ROOT/'tile-thickness-validation.json').write_text(json.dumps({
    'targetNormalThickness':TILE_THICKNESS,'targetNormalRelief':TILE_RELIEF,
    'count':len(tile_thickness_checks),'minimum':min(v['normalThickness'] for v in tile_thickness_checks),
    'maximum':max(v['normalThickness'] for v in tile_thickness_checks),
    'tiles':tile_thickness_checks},indent=2))
