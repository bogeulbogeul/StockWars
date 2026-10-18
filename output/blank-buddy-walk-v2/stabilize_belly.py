import bpy,json,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v1/somangi-walk-eye-fixed.blend'))
s=bpy.context.scene;mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig']
original=[tuple(v.co) for v in mesh.data.vertices]
core=[v.index for v in mesh.data.vertices if -.63<v.co.z<-.20 and abs(v.co.x)<.27]
def residual():
    worst=0
    for f in range(1,25):
        s.frame_set(f);deps=bpy.context.evaluated_depsgraph_get()
        obj=mesh.evaluated_get(deps);temp=obj.to_mesh()
        body=rig.pose.bones['Body'].matrix@rig.data.bones['Body'].matrix_local.inverted()
        worst=max(worst,max((temp.vertices[i].co-body@mesh.data.vertices[i].co).length for i in core))
        obj.to_mesh_clear()
    return worst
before=residual()
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
names={g.index:g.name for g in mesh.vertex_groups};groups={g.name:g for g in mesh.vertex_groups}
for v in mesh.data.vertices:
    weights={names[g.group]:g.weight for g in v.groups}
    # Retain leg control below the body, blending only at the narrow hip join.
    leg_factor=1-smooth(-.75,-.65,v.co.z)
    for name in ['Leg.L','Leg.R']:
        old=weights.get(name,0);weights[name]=old*leg_factor
        weights['Body']=weights.get('Body',0)+old*(1-leg_factor)
    # Central pear-shaped torso follows Body rigidly; shoulders remain blended.
    if -.65<v.co.z<-.16:
        core_factor=1-smooth(.27,.36,abs(v.co.x))
        weights={n:w*(1-core_factor) for n,w in weights.items()}
        weights['Body']=weights.get('Body',0)+core_factor
    total=sum(weights.values())
    for group in mesh.vertex_groups:group.remove([v.index])
    for name,w in weights.items():
        if w>1e-8:groups[name].add([v.index],w/total,'REPLACE')
after=residual()
assert after<1e-5
assert original==[tuple(v.co) for v in mesh.data.vertices]
report={'belly_vertices_checked':len(core),'max_belly_deformation_before':before,
 'max_belly_deformation_after':after,'geometry_unchanged':True,
 'max_weight_error':max(abs(sum(g.weight for g in v.groups)-1) for v in mesh.data.vertices)}
s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),use_selection=True,
 export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',
 export_materials='EXPORT',export_cameras=False,export_lights=False)
cam=s.camera;s.cycles.samples=12;s.render.resolution_x=480;s.render.resolution_y=480
for label,pos in [('front',(0,-6,0)),('side',(6,0,0))]:
    folder=P/(label+'-frames');folder.mkdir(exist_ok=True)
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    for f in range(1,25):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
(P/'belly-validation.json').write_text(json.dumps(report,indent=2))
print('BELLY_STABLE',json.dumps(report))
