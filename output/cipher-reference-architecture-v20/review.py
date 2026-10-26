"""Inspect the actual saved model and render independent architecture views."""
import bpy,sys,json,math
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
from projection import P,design,project
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
scene=bpy.context.scene;cam=scene.camera
asset=[o for o in scene.objects if o.type=='MESH' and not o.name.startswith(('Preview_','Studio_'))]
assert all(math.isfinite(c) for o in asset for v in o.data.vertices for c in v.co)
columns=[o for o in asset if o.name.startswith('Portico_Column') and not o.name.startswith(('Portico_Column_Capital','Portico_Column_Plinth'))]
assert len(columns)==4
for o in columns:
 points=[o.matrix_world@v.co for v in o.data.vertices]
 low=min(p.z for p in points);high=max(p.z for p in points)
 assert abs(low-.45)<.004 and abs(high-1.715)<.004
assert all(bpy.data.objects.get(n) for n in ('Clock_Hour','Clock_Minute','Door_Assembly'))
d=design();rows=[]
for name,point,target in [('central peak',d['peak'],(593,331)),('rear ridge',d['rear'],(780,305)),
 ('left gable',d['left'],(364,493)),('right gable',d['right'],(822,502)),
 ('left wing ridge',d['ridgeLeft'],(270,418)),('right wing ridge',d['ridgeRight'],(1110,443))]:
 actual=project(point);rows.append({'name':name,'target':target,'projected':actual,'errorPixels':math.dist(actual,target)})
report={'finiteMeshPositions':True,'straightRoundColumns':4,'clockAndDoorNodes':True,
 'roofLandmarks':rows,'foundationAndEaveFit':json.loads((ROOT/'calibration.json').read_text())['rmsPixels'],
 'actualRender':'front-right.png','gameApplied':False}
(ROOT/'geometry-validation.json').write_text(json.dumps(report,indent=2))
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=20
for name,loc,target,scale in [('front',(0,-12,3.9),(.2,-.1,1.35),7.5),
 ('rear',(6,10,5.5),(0,0,1.3),8),('junction',(4,-7,4.6),(1,-.2,2.0),3.4)]:
 cam.data.type='ORTHO';cam.data.ortho_scale=scale;cam.location=loc
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
