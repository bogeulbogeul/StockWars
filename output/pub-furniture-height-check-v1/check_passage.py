"""Animated mesh contact audit; does not claim pub gameplay integration."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'pub-bar-open-right-v1'/'Pub-bar-room-preview.blend'))
scene=bpy.context.scene
furniture=[o for o in scene.objects if o.type=='MESH' and
           o.name.startswith(('Bar_Counter_','Counter_Front_','Stool_'))]
source=ROOT.parent/'somangi-crab-walk-v4'/'somangi-crab-walk.blend'
with bpy.data.libraries.load(str(source),link=False) as (src,dst):
    dst.objects=list(src.objects)
    dst.actions=[a for a in src.actions if a=='Crab_Left']
loaded=[o for o in dst.objects if o]
rig=next(o for o in loaded if o.type=='ARMATURE')
def belongs(obj):
    parent=obj
    while parent:
        if parent==rig:return True
        parent=parent.parent
    return any(m.type=='ARMATURE' and m.object==rig for m in obj.modifiers)
character=[o for o in loaded if o.type in {'MESH','ARMATURE'} and belongs(o)]
for obj in character:
    if not obj.users_collection:scene.collection.objects.link(obj)
rig.animation_data_create()
rig.animation_data.action=next(a for a in dst.actions if a and a.name.startswith('Crab_Left'))
wrapper=bpy.data.objects.new('Passage_Character_Placement',None)
scene.collection.objects.link(wrapper)
for obj in character:
    if obj.parent not in character:
        world=obj.matrix_world.copy()
        obj.parent=wrapper
        obj.matrix_world=world
# Working convention: room unit=100 game units, matching the 8x6 cozy room.
# Pub runtime scale has not been installed; this convention remains provisional.
wrapper.scale=(1/1.95,)*3
wrapper.rotation_euler.z=math.pi/2
scene.frame_set(1)
def character_mesh():
    graph=bpy.context.evaluated_depsgraph_get()
    vertices=[]
    faces=[]
    for obj in character:
        if obj.type!='MESH':continue
        ev=obj.evaluated_get(graph)
        mesh=ev.to_mesh()
        start=len(vertices)
        vertices.extend(ev.matrix_world@v.co for v in mesh.vertices)
        faces.extend(tuple(start+i for i in p.vertices) for p in mesh.polygons)
        ev.to_mesh_clear()
    return vertices,faces
vertices,_=character_mesh()
wrapper.location.z=.022-min(v.z for v in vertices)
def tree(obj):
    graph=bpy.context.evaluated_depsgraph_get()
    ev=obj.evaluated_get(graph)
    mesh=ev.to_mesh()
    vertices=[ev.matrix_world@v.co for v in mesh.vertices]
    faces=[tuple(p.vertices) for p in mesh.polygons]
    out=BVHTree.FromPolygons(vertices,faces)
    bounds=tuple((min(v[i] for v in vertices),max(v[i] for v in vertices)) for i in range(3))
    ev.to_mesh_clear()
    return obj.name,out,bounds
static=[tree(o) for o in furniture]
def audit(y,samples):
    hits=[]
    min_gap=99
    for i in range(samples):
        x=1.20-4.60*i/(samples-1)
        # Match clip phase to distance (13.5 game units per loop), as runtime does.
        phase=(4.60*i/(samples-1)/.135)%1
        scene.frame_set(1+int(phase*24),subframe=(phase*24)%1)
        wrapper.location.x=x
        wrapper.location.y=y
        bpy.context.view_layer.update()
        vertices,faces=character_mesh()
        bounds=tuple((min(v[k] for v in vertices),max(v[k] for v in vertices)) for k in range(3))
        min_gap=min(min_gap,.60-bounds[1][1],bounds[1][0]-0)
        moving=None
        for name,fixed,box in static:
            if any(bounds[k][1]<box[k][0] or bounds[k][0]>box[k][1] for k in range(3)):continue
            if moving is None:moving=BVHTree.FromPolygons(vertices,faces)
            if moving.overlap(fixed):hits.append({'sample':i,'x':x,'object':name})
    return {'y':y,'samples':samples,'intersection_count':len(hits),'hits':hits[:30],
            'conservative_gap_to_counter_or_stool_band':min_gap}
results=[audit(.30,97)]
report={'motion':'adopted Crab_Left v4','source':str(source),'character_height':1.0,
        'scale_assumption':'100 game units per pub model unit; pub runtime not integrated',
        'geometry':'evaluated animated meshes vs actual counter/stool meshes using triangle BVH',
        'results':results,'runtime_auto_transition_and_collision':'not tested: pub is not installed'}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('CONTACT_AUDIT',json.dumps(report))
scene.render.engine='CYCLES'
scene.cycles.samples=6
scene.cycles.use_denoising=True
scene.render.resolution_x=720
scene.render.resolution_y=540
cam=scene.camera
cam.data.type='ORTHO'
cam.data.ortho_scale=5.9
cam.location=(1,-6,5)
target=Vector((-1,.30,.60))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
frames=ROOT/'frames'
frames.mkdir(exist_ok=True)
for i in [6,11,15]:
    phase=(i*4.60/23/.135)%1
    scene.frame_set(1+int(phase*24),subframe=(phase*24)%1)
    wrapper.location.x=1.20-4.60*i/23
    wrapper.location.y=.30
    scene.render.filepath=str(frames/f'{i:03}.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Pub-crab-contact-preview.blend'))

