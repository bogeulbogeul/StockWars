"""Full reference asset review, retaining native clock and entry nodes."""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
sys.path.insert(0,str(ROOT.parent/'cipher-grand-single-v4'))
sys.path.insert(0,str(ROOT.parent/'cipher-roof-traced-v17'))
sys.path.insert(0,str(ROOT))
from exterior_geometry import box,finish
from fit import fit as fit_full
from roof_geometry import build_roof
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-roof-traced-v17'/'CipherSecurities-traced-roof.blend'))
scene=bpy.context.scene
cam=scene.camera
fit=fit_full()
for o in list(scene.objects):
    if o.name.startswith('Ref_'):bpy.data.objects.remove(o,do_unlink=True)
roof=dict(zip(('centralHalfWidth','centralPeak','centralEave','centralBack','wingRidge','wingDepth','centralRearDrop','wingOuterRidgeX'),fit[6:14]))
checks=build_roof(roof)
# Keep the facade behind the portico; extend the rear half only.
for o in list(scene.objects):
    if o.name.startswith(('Central_Sealed_Side_Cornice','Central_Blue_Straight_Eave')):
        bpy.data.objects.remove(o,do_unlink=True)
    elif o.name.startswith(('Grand_Central_Shell','Grand_Central_Front_Wall','Grand_Rear_Windowless_Wall')):
        inv=o.matrix_world.inverted()
        for v in o.data.vertices:
            p=o.matrix_world@v.co
            h=roof['centralPeak']-(roof['centralPeak']-roof['centralEave'])*abs(p.x)/roof['centralHalfWidth']-roof['centralRearDrop']*(p.y+1.49)/(roof['centralBack']+1.49)-.085
            if p.z>h:p.z=h;v.co=inv@p
cream=bpy.data.materials['Trim_Cream']
for o in list(scene.objects):
    if o.name.startswith('Portico_Column') and not o.name.startswith(('Portico_Column_Capital','Portico_Column_Plinth')):
        bpy.data.objects.remove(o,do_unlink=True)
for x in (-1,-.66,.66,1):
    profile=[(.16,.49),(.16,.53),(.15,.55),(.128,.57),(.12,.60),(.116,.64),
      (.116,1.91),(.125,1.94),(.145,1.95),(.145,1.975),(.125,1.99),
      (.15,2.005),(.15,2.035),(.16,2.055),(.16,2.115)]
    n=64;verts=[(x+r*math.cos(2*math.pi*j/n),-1.28+r*math.sin(2*math.pi*j/n),z) for r,z in profile for j in range(n)]
    faces=[(k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j) for k in range(len(profile)-1) for j in range(n)]
    faces += [tuple(range(n-1,-1,-1)),tuple(range((len(profile)-1)*n,len(profile)*n))]
    mesh=bpy.data.meshes.new('Ringed_Column');mesh.from_pydata(verts,[],faces)
    o=bpy.data.objects.new('Portico_Column',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.003)
    for face in mesh.polygons:face.use_smooth=len(face.vertices)==4
for name,color in [('Roof_Blue',(.016,.075,.16,1)),('Preview_Gray',(.38,.40,.44,1))]:
    mat=bpy.data.materials.get(name)
    if mat:mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color
yaw,pitch=fit[:2]
right=Vector((math.cos(yaw),math.sin(yaw),0))
up=Vector((-math.sin(pitch)*math.sin(yaw),math.sin(pitch)*math.cos(yaw),math.cos(pitch)))
look=Vector((math.cos(pitch)*math.sin(yaw),-math.cos(pitch)*math.cos(yaw),math.sin(pitch)))
target=right*fit[4]+up*fit[5]
cam.location=target+look*fit[2]
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='PERSP';cam.data.lens=fit[3]*36/1374
scene.render.resolution_x=1374;scene.render.resolution_y=1145
scene.render.resolution_percentage=100;scene.cycles.samples=32
scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.render.filepath=str(ROOT/'front-right.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
for name,loc,target,scale in [('front',(0,-10,3.8),(0,-.2,1.45),7.5),
 ('rear',(5,9,4.7),(0,0,1.4),7.8),('junction',(4,-6,4),(1,-.05,2.2),3.3)]:
    cam.data.type='ORTHO';cam.data.ortho_scale=scale;cam.location=loc
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),
 'reference':'reference.png','gameApplied':False,'roof':roof,'tileChecks':checks},indent=2))
