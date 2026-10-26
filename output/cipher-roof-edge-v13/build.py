"""Continuous constant-section blue gable edge, matched to the reference."""
import bpy,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-roof-grid-clean-v12'/'CipherSecurities-roof-reference.blend'))
scene=bpy.context.scene;blue=bpy.data.materials['Roof_Blue']
slope=.75/1.17
nz=1/math.sqrt(1+slope*slope)
thickness=.055
for side in (-1,1):
    a,b=sorted((0,side*1.17))
    h=lambda x:2.99-slope*abs(x)
    contour=[(a,h(a)+.009/nz),(b,h(b)+.009/nz),
             (b,h(b)+(.009-thickness)/nz),(a,h(a)+(.009-thickness)/nz)]
    # Forward of the cream border: the border can no longer mask the blue edge.
    extrude('Central_Constant_Section_Blue_Front_Edge',contour,-1.535,-1.480,blue,.002)
    # Same clear thickness at the rear edge; no taper toward either eave.
    extrude('Central_Constant_Section_Blue_Rear_Edge',contour,1.075,1.125,blue,.002)
for obj in list(scene.objects):
    if obj.name.startswith('Central_Ridge_Cap'):bpy.data.objects.remove(obj,do_unlink=True)
for i in range(11):
    a=-1.537+i*2.664/11;b=a+2.664/11-.003
    contour=[(.070*math.cos(math.pi*j/32),2.982+.050*math.sin(math.pi*j/32)) for j in range(33)]
    contour.append((0,2.966))
    extrude('Central_Ridge_Cap',contour,a,b,blue,.002)
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
# Measure the visible front band's width perpendicular to the slope at five points.
samples=[]
for x in (0,.2925,.585,.8775,1.17):
    top=2.99-slope*x+.009/nz
    bottom=2.99-slope*x+(.009-thickness)/nz
    value=(top-bottom)*nz
    assert abs(value-thickness)<1e-8
    samples.append({'distanceFromRidge':x,'frontBlueBandThickness':value})
(ROOT/'edge-validation.json').write_text(json.dumps({'target':thickness,'samples':samples},indent=2))
scene.cycles.samples=24;cam=scene.camera
for name,loc,target,scale,width,height in [
    ('reference-angle',(4,-10,3.48),(0,-.05,2.43),6.7,1536,576),
    ('central-close',(4.4,-10.1,3.65),(.4,-.1,2.6),3.1,1200,800),
    ('front-right',(5,-9,4.6),(0,-.18,1.4),7.6,1200,800),
    ('rear',(5,9,4.6),(0,0,1.4),7.6,1200,800)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_x=width;scene.render.resolution_y=height
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-roof-edge.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
    'gameApplied':False,'visibleEdgeThickness':thickness},indent=2))
