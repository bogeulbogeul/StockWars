"""Reconstruct the entire adopted silhouette in actual native 3D geometry."""
import bpy,sys,math,json,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from shape import Cage
from exterior_geometry import box,stroke
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-full-reference-v18'/'CipherSecurities-reference.blend'))
scene=bpy.context.scene;cam=scene.camera
cfg=json.loads((ROOT.parent/'cipher-full-reference-v18'/'manifest.json').read_text())['roof']
w=cfg['centralHalfWidth'];peak=cfg['centralPeak'];eave=cfg['centralEave'];back=cfg['centralBack']
D=cfg['wingDepth'];ridge=cfg['wingRidge'];outer=cfg['wingOuterRidgeX'];drop=cfg['centralRearDrop']
# First correct the sunken column capitals so their rings sit below the beam.
for o in scene.objects:
 if o.name.startswith('Portico_Column_Capital'):o.location.z-=.19
 if o.name.startswith('Portico_Column') and not o.name.startswith(('Portico_Column_Capital','Portico_Column_Plinth')):
  for v in o.data.vertices:
   z=v.co.z
   if z>.64:v.co.z=.64+(z-.64)*(2.115-.19-.64)/(2.115-.64)
landmarks=[
 ('gable peak',(0,-1.49,peak),(593,331)),
 ('rear ridge',(0,back,peak-drop),(780,305)),
 ('left blue gable end',(-w,-1.49,eave),(364,493)),
 ('right blue gable end',(w,-1.49,eave),(822,502)),
 ('left eave',(-3.13,-D,1.95),(40,523)),
 ('right front eave',(3.13,-D,1.95),(1178,591)),
 ('right rear eave',(3.13,D,1.95),(1334,530)),
 ('right horizontal ridge',(outer,0,ridge),(1110,443)),
 ('left horizontal ridge',(-outer,0,ridge),(270,418)),
 ('left foundation',(-3.11,-.985,0),(40,815)),
 ('right foundation',(3.11,-.985,0),(1175,927)),
 ('right rear foundation',(3.11,.985,0),(1330,815)),
 ('entry bottom',(0,-1.12,.30),(605,821)),
 ('stair front midpoint',(0,-2.11,0),(560,906)),
 ('left stair cheek',(-1.69,-2.11,0),(278,880)),
 ('right stair cheek',(1.69,-2.11,0),(787,931)),
 ('left column foot',(-1,-1.28,.49),(421,777)),
 ('right column foot',(1,-1.28,.49),(784,811)),
]
bpy.context.view_layer.update()
cage=Cage(cam,1374,1145,landmarks)
# Curves become native meshes before the continuous cage is applied.
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in scene.objects if o.type=='CURVE' and not o.name.startswith(('Preview_','Studio_'))]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
asset=[o for o in scene.objects if o.type in ('MESH','EMPTY') and not o.name.startswith(('Preview_','Studio_'))]
original={o.name:o.matrix_world.copy() for o in asset}
# Transform hierarchy pivots before restoring every child's world transform.
def hierarchy_depth(o):
 depth=0
 while o.parent:depth+=1;o=o.parent
 return depth
for o in sorted(asset,key=hierarchy_depth):
 matrix=original[o.name].copy()
 if o.type=='EMPTY':matrix.translation=Vector(cage.deform(np.array([matrix.translation[:]],float))[0])
 o.matrix_world=matrix
for o in asset:
 if o.type!='MESH':continue
 old=original[o.name];o.data=o.data.copy()
 coords=np.array([(old@v.co)[:] for v in o.data.vertices],float)
 moved=cage.deform(coords);inv=o.matrix_world.inverted()
 for v,p in zip(o.data.vertices,moved):v.co=inv@Vector(p)
 o.data.update()
# Native relief detail follows the five-spoke fanlight in the reference.
gold=bpy.data.materials['Cipher_Satin_Brass']
for a in (math.pi/6,5*math.pi/6):
 points=np.array([(0,-1.133,1.0155),(.421*math.cos(a),-1.133,1.0155+.421*math.sin(a))])
 stroke('Reference_Additional_Fanlight_Spoke',cage.deform(points).tolist(),.006,gold)
scene.render.resolution_x=1374;scene.render.resolution_y=1145;scene.render.resolution_percentage=100
scene.cycles.samples=12
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
for o in scene.objects:
 if o.name.startswith('Reference_Additional_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-proportions.blend'))
report={'method':'Actual 3D vertex cage, unchanged render camera; no raster deformation',
 'landmarks':cage.report(),'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()}
(ROOT/'measurements.json').write_text(json.dumps(report,indent=2))
