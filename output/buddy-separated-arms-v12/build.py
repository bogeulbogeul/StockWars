import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-connections-v11/buddy-soft-connections.blend'))
body=bpy.data.objects['Buddy_Original'];rig=bpy.data.objects['Buddy_Rig'];scene=bpy.context.scene
rig.data.pose_position='REST';bpy.context.view_layer.update()
source=body.data.copy()
def cut(data,sign,keep_arm):
    bm=bmesh.new();bm.from_mesh(data)
    # Diagonal seam follows the armpit, leaving a root hidden under the head.
    normal=Vector((sign,0,.28));point=Vector((sign*.29,0,0))
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
        dist=.00001,plane_co=point,plane_no=normal,
        clear_inner=keep_arm,clear_outer=not keep_arm)
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:
        filled=bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
        caps=filled.get('faces',[])
        bmesh.ops.triangulate(bm,faces=caps)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(data);bm.free();data.update()
arms=[]
for side,sign in [('L',1),('R',-1)]:
    data=source.copy();cut(data,sign,True)
    # The plane also intersects the large head; discard the disconnected head piece.
    bm=bmesh.new();bm.from_mesh(data)
    remove=[v for v in bm.verts if v.co.z>.015]
    bmesh.ops.delete(bm,geom=remove,context='VERTS')
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    o=bpy.data.objects.new('Separate_Arm.'+side,data);bpy.context.collection.objects.link(o)
    # Small outward offset provides clearance without changing the limb silhouette.
    for v in data.vertices:
        t=max(0,min(1,(v.co.z+.38)/.34));t=t*t*(3-2*t)
        v.co.x+=sign*(.012-.09*t)
    o.vertex_groups.clear();g=o.vertex_groups.new(name='Arm.'+side)
    g.add(list(range(len(data.vertices))),1,'REPLACE')
    mod=o.modifiers.new('Rigid arm bone','ARMATURE');mod.object=rig;o.parent=rig
    for f in data.polygons:f.use_smooth=True
    arms.append(o)
# Remove matching arm surfaces from body, restricted below the head.
bm=bmesh.new();bm.from_mesh(body.data)
for sign in [1,-1]:
    # Bisect the complete mesh then only delete the arm-region faces/vertices.
    normal=Vector((sign,0,.28));point=Vector((sign*.29,0,0))
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,
        plane_co=point,plane_no=normal)
    remove=[v for v in bm.verts if v.co.z<.015 and sign*v.co.x+.28*v.co.z>.29001]
    bmesh.ops.delete(bm,geom=remove,context='VERTS')
boundary=[e for e in bm.edges if e.is_boundary]
if boundary:
    filled=bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.triangulate(bm,faces=filled.get('faces',[]))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
def soften_seam(data):
    bm=bmesh.new();bm.from_mesh(data)
    selected=[v for v in bm.verts if v.co.z<.015 and abs(abs(v.co.x)+.28*v.co.z-.29)<.035]
    for iteration in range(50):
        bmesh.ops.smooth_vert(bm,verts=selected,factor=.45,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
soften_seam(body.data)
for arm in arms:soften_seam(arm.data)
for obj in [body]+arms:
    bm=bmesh.new();bm.from_mesh(obj.data)
    edges=[e for e in bm.edges if e.is_boundary]
    if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(obj.data);bm.free()
    for e in obj.data.edges:e.use_edge_sharp=False
    if obj.data.has_custom_normals:
        obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))
# Remove all arm influence from the remaining torso, retaining head/leg skinning.
arm_ids={body.vertex_groups['Arm.L'].index,body.vertex_groups['Arm.R'].index}
bg=body.vertex_groups['Body']
for v in body.data.vertices:
    amount=sum(g.weight for g in v.groups if g.group in arm_ids)
    if amount:bg.add([v.index],amount,'ADD')
for name in ['Arm.L','Arm.R']:body.vertex_groups.remove(body.vertex_groups[name])
for f in body.data.polygons:f.use_smooth=True
rig.data.pose_position='POSE';scene.frame_set(1)
parts=[body]+arms
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-separated-arms.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-separated-arms.glb'),use_selection=True,export_format='GLB',export_animation_mode='ACTIONS')
scene.render.resolution_x=600;scene.render.resolution_y=600
for name,pos in [('front',(2,-7,1.15)),('side',(7,0,-.02))]:
    cam=scene.camera;cam.location=pos
    cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for frame in range(1,33,2):
        scene.frame_set(frame);scene.render.filepath=str(folder/f'{frame:03}.png');bpy.ops.render.render(write_still=True)
report={'parts':[o.name for o in parts],'arm_bone_influence_on_body':False,
 'arm_skin':'one rigid bone each','boundary_edges':{}}
for o in parts:
    bm=bmesh.new();bm.from_mesh(o.data)
    report['boundary_edges'][o.name]=sum(e.is_boundary for e in bm.edges);bm.free()
(P/'validation.json').write_text(json.dumps(report,indent=2))
