"""Reference roof: long horizontal wing ridges and clean central gable."""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
sys.path.insert(0, str(ROOT.parent / 'cipher-grand-single-v4'))
from exterior_geometry import box, extrude, stroke
from roof import clip, slab

bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'cipher-joints-ground-v6' / 'CipherSecurities-clean-joints.blend'))
scene = bpy.context.scene
blue = bpy.data.materials['Roof_Blue']
for obj in list(scene.objects):
    if obj.name.startswith(('Wing_Hip_Roof', 'Blue_Clay_Roof_Tile_Wing', 'Wing_Hip_Sealed_Cap', 'Wing_Blue_Eave', 'Central_Ridge_Cap')):
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
            # Clip to the actual central-gable intersection at the inner edge.
            polygon = clip(polygon, lambda u,y: max(u-1.16, height(u,y)-(2.99-.75*u/1.17)))
            slab(name, [(side*u,y) for u,y in polygon],
                 lambda x,y:height(abs(x),y), blue, offset, thick)
        emit('Wing_Long_Hip_Roof', rect[:])
        for i in range(10):
            for j in range(10):
                u=.90+i*2.23/10; y=-1.08+j*2.16/10
                emit('Wing_Reference_Tile', [(u+.003,y+.003),(u+.220,y+.003),
                     (u+.220,y+.213),(u+.003,y+.213)], .012,.023)
    # Segmented half-round ridge caps, aligned with the front facade.
    for i in range(7):
        a=.95+i*1.58/7; b=a+1.58/7-.003
        points=[(side*u,0,2.393) for u in (a,b)]
        stroke('Wing_Horizontal_Ridge_Cap', points,.047,blue)
    for sy in (-1,1):
        stroke('Wing_Outer_Hip_Cap',[(side*(2.53+.60*t),sy*1.08*t,2.393-.43*t)
               for t in [i/32 for i in range(33)]],.023,blue)
        box('Wing_Blue_Eave',(1.97,.042,.065),(side*2.145,sy*1.08,1.91),blue,.005)
    box('Wing_Blue_Eave',(.042,2.16,.065),(side*3.13,0,1.91),blue,.005)

for j in range(10):
    a=-1.50+j*2.6/10; b=a+2.6/10-.004
    contour=[(.065*math.cos(math.pi*k/32),2.99+.065*math.sin(math.pi*k/32)) for k in range(33)]
    extrude('Central_Ridge_Cap',contour,a,b,blue,.003)

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
    ('roof-detail',(4,-7,4.1),(.4,-.1,2.38),6.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-roof-reference.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'wingRidgeOuterX':2.53,'wingRidgeZ':2.38,'gameApplied':False},indent=2))
