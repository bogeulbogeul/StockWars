"""Reference roof: long horizontal wing ridges and clean central gable."""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
sys.path.insert(0, str(ROOT.parent / 'cipher-grand-single-v4'))
from exterior_geometry import box, extrude, stroke, finish
from roof import clip, slab

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'cipher-joints-ground-v6' / 'CipherSecurities-clean-joints.blend'))
scene = bpy.context.scene
blue = bpy.data.materials['Roof_Blue']
TILE=.24
GAP=.006
def steps(lo,hi,step):
    value=lo
    while value<hi-1e-7:
        yield value,min(value+step,hi)
        value+=step

def caps(name,start,end,radius):
    """Identical rounded barrel segments along horizontal and inclined ridges."""
    start,end=Vector(start),Vector(end)
    axis=(end-start).normalized();length=(end-start).length
    up=(Vector((0,0,1))-axis*axis.z).normalized()
    across=axis.cross(up).normalized()
    for lo,hi in steps(0,length,TILE):
        a=start+axis*(lo+.0015)
        b=start+axis*(hi-.0015)
        profile=[across*(radius*math.cos(math.pi*j/32))+up*(radius*.78*math.sin(math.pi*j/32)) for j in range(33)]
        verts=[tuple(p+v) for p in (a,b) for v in profile]
        n=len(profile)
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[face[::-1] for face in faces]);mesh.update()
        obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
        finish(obj,blue,.003)
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
            for inside in (True, False):
                p=clip(polygon, lambda u,y:1.17-u if inside else u-1.17)
                if inside:
                    p=clip(p, lambda u,y:height(u,y)-(2.99-.75*u/1.17)-.006)
                slab(name, [(side*u,y) for u,y in p],
                     lambda x,y:height(abs(x),y), blue, offset, thick)
        emit('Wing_Long_Hip_Roof', rect[:])
        du=TILE/math.sqrt(1+(.43/.60)**2) if k==2 else TILE
        dy=TILE if k==2 else TILE/math.sqrt(1+(.43/1.08)**2)
        gu=GAP*du/TILE;gy=GAP*dy/TILE
        for ua,ub in steps(.90,3.13,du):
            for ya,yb in steps(-1.08,1.08,dy):
                emit('Wing_Reference_Tile', [(ua+gu/2,ya+gy/2),(ub-gu/2,ya+gy/2),
                     (ub-gu/2,yb-gy/2),(ua+gu/2,yb-gy/2)], .012,.023)
    # Segmented half-round ridge caps, aligned with the front facade.
    caps('Wing_Horizontal_Ridge_Cap',(side*.94,0,2.39),(side*2.53,0,2.39),.064)
    for sy in (-1,1):
        caps('Wing_Outer_Hip_Cap',(side*2.53,sy*.025,2.39),
             (side*3.13,sy*1.08,1.96),.055)
        box('Wing_Blue_Eave',(1.97,.042,.065),(side*2.145,sy*1.08,1.91),blue,.005)
    box('Wing_Blue_Eave',(.042,2.16,.065),(side*3.13,0,1.91),blue,.005)

# Rebuild central planes and tiles, cutting BOTH roofs at the shared intersection.
cream=bpy.data.materials['Trim_Cream']
for side in (-1,1):
    def central_height(x,y):return 2.99-.75*abs(x)/1.17
    def central_emit(name,poly,offset=0,thick=.065):
        for ya,yb in [(-1.49,-1.08),(-1.08,0),(0,1.08),(1.08,1.09)]:
            p=clip(clip(poly,lambda x,y:y-ya),lambda x,y:yb-y)
            if ya>=-1.08 and yb<=1.08:
                sign=-1 if yb<=0 else 1
                p=clip(p,lambda x,y:central_height(x,y)-(2.38-.43*sign*y/1.08)-.006)
            slab(name,p,central_height,blue,offset,thick)
    a,b=sorted((0,side*1.17))
    central_emit('Central_Junction_Cut_Roof',[(a,-1.49),(b,-1.49),(b,1.09),(a,1.09)])
    for xa,xb in steps(a,b,TILE/math.sqrt(1+(.75/1.17)**2)):
        xa+=GAP/(2*math.sqrt(1+(.75/1.17)**2));xb-=GAP/(2*math.sqrt(1+(.75/1.17)**2))
        for ya,yb in steps(-1.49,1.09,TILE):
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

caps('Central_Ridge_Cap',(0,-1.50,3.00),(0,1.10,3.00),.075)

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
    ('roof-detail',(4,-7,4.1),(.4,-.1,2.38),6.8),
    ('junction-close',(4,-5,4.5),(1.05,-.1,2.38),1.65),
    ('ridge-close',(3,-4,4),(2.5,0,2.25),1.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-roof-reference.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'wingRidgeOuterX':2.53,'wingRidgeZ':2.38,'surfaceTilePitch':TILE,'tileGap':GAP,
    'edgeTiles':'clipped to roof boundaries','gameApplied':False},indent=2))
