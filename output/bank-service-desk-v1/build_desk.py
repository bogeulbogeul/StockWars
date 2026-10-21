"""Bank service desk and placement preview; no gameplay integration."""
import bpy, sys, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish,stroke
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-room-shell-v1'/'Bank-room-shell.blend'))
before=set(bpy.context.scene.objects)
wood=material('Desk_Warm_Wood',(.36,.175,.062))
cream=material('Desk_Cream',(.86,.74,.53))
trim=material('Desk_Cream_Trim',(.93,.81,.60))
gold=material('Desk_Brass',(.72,.43,.10))
# Rounded rectangular plan with real curved end corners.
def slab(name,w,d,r,z,h,mat):
    # One continuous U footprint: real open staff bay, no stacked side boxes.
    corners=[(-w/2,-d/2),(w/2,-d/2),(w/2,.65),(1.30,.65),
             (1.30,.22),(-1.30,.22),(-1.30,.65),(-w/2,.65)]
    path=[]
    for i,p in enumerate(corners):
        prev,nxt=corners[i-1],corners[(i+1)%len(corners)]
        a=Vector(prev)-Vector(p);b=Vector(nxt)-Vector(p)
        distance=min(r,a.length*.45,b.length*.45)
        start=Vector(p)+a.normalized()*distance
        end=Vector(p)+b.normalized()*distance
        for j in range(17):
            t=j/16
            q=(1-t)**2*start+2*t*(1-t)*Vector(p)+t*t*end
            path.append(tuple(q))
    n=len(path)
    verts=[(x,y,zz) for zz in [z,z+h] for x,y in path]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    return finish(obj,mat,.008)
slab('Desk_Wood_Plinth',3.64,.85,.26,.024,.09,wood)
slab('Desk_Cream_Body',3.56,.79,.23,.105,.60,cream)
slab('Desk_Rounded_Wood_Countertop',3.76,.94,.30,.705,.085,wood)
# Front molding is one continuous closed rounded outline, no crossing seams.
points=[]
for cx,cz,start in [(1.22,.585,0),(-1.22,.585,90),(-1.22,.235,180),(1.22,.235,270)]:
    for i in range(17):
        t=math.radians(start+i*90/16)
        points.append((cx+.055*math.cos(t),-.402,cz+.055*math.sin(t)))
points.append(points[0]);stroke('Desk_Front_Panel_Molding',points,.012,trim)
asset=list(set(bpy.context.scene.objects)-before)
# Local origin is floor center; placement has generous side and rear staff routes.
for obj in asset:obj.location.y+=.35
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-service-desk.glb'),export_format='GLB',use_selection=True)
for obj in bpy.context.scene.objects:obj.select_set(obj.type in {'MESH','CURVE'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-desk-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene
scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-desk-room-preview.blend'))
cam=scene.camera;target=Vector((0,.35,.44));cam.location=(3,-5.3,3.5)
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.6
scene.render.filepath=str(ROOT/'desk-close.png');bpy.ops.render.render(write_still=True)
assert (8-3.76)/2>2
assert 2.76-(.35+.65)>1.2
(ROOT/'manifest.json').write_text(json.dumps({'status':'desk model and room preview; game integration pending','dimensions':[3.76,1.12,.79],'placement':[0,.35,0],'units':'temporary model units, character height assumed 1.0','side_clearance':2.12,'rear_clearance':1.76,'staff_bay_width':2.60,'shape':'shallow gentle U, short rounded returns, open rear, no countertop decorations','includes':'desk only, no loose tabletop props or chair','validation':'side/rear static clearances; user and character contact review pending'},indent=2),encoding='utf-8')
