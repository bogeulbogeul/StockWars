"""Replace dense planter vegetation with a small native, editable flower arrangement."""
import bpy,bmesh,pathlib,math,json,numpy as np
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'ClothingStore.blend'))
for o in list(bpy.context.scene.objects):
    if o.type=='MESH':bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'ClothingStore-flower-fixed.glb'))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH');body.name='ClothingStoreBody'
bm=bmesh.new();bm.from_mesh(body.data);bm.faces.ensure_lookup_table();remove=[]
source_mat=body.data.materials[0];source_shader=next(n for n in source_mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
image=source_shader.inputs['Base Color'].links[0].from_node.image;w,h=image.size;pixels=np.array(image.pixels[:]).reshape(h,w,4);uv=bm.loops.layers.uv.active
for f in bm.faces:
    x,y,z=body.matrix_world@f.calc_center_median()
    if -.70<x<-.33 and -.845<y<-.61 and -.74<z<-.441:remove.append(f)
removed=len(remove);bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(body.data);bm.free();body.data.update()
def material(name,rgb):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=.86
    return m
green=material('PlanterLeafGreen',(.075,.20,.065));light=material('PlanterLeafLight',(.13,.29,.10));cream=material('PlanterIvoryPetals',(.92,.85,.65));yellow=material('PlanterGoldenCenters',(.95,.57,.07));soil=material('PlanterSoil',(.095,.052,.022))
created=[]
stone=material('PlanterCleanStone',(.68,.55,.38));wood=material('PlanterBackingWood',(.46,.245,.075))
def box(name,position,scale,mat,bevel):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position);o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    modifier=o.modifiers.new('SoftEdges','BEVEL');modifier.width=bevel;modifier.segments=3
    o.modifiers.new('WeightedNormals','WEIGHTED_NORMAL');created.append(o);return o
box('WindowBackingRepair',(-.515,-.605,-.565),(.40,.05,.21),wood,.006)
box('WindowSillRepair',(-.515,-.605,-.459),(.40,.06,.034),wood,.007)
box('CleanPlanterContainer',(-.515,-.704,-.665),(.408,.215,.132),stone,.012)
def ellipsoid(name,position,scale,mat,rotation=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=position)
    o=bpy.context.object;o.name=name;o.scale=scale
    if rotation is not None:o.rotation_euler=rotation
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    created.append(o);return o
ellipsoid('PlanterSoil',(-.515,-.693,-.597),(.182,.085,.010),soil)
for i,x in enumerate([-.63,-.515,-.40]):
    ellipsoid('FoliageClump'+str(i),(x,-.693,-.579),(.071,.068,.027),green)
for i in range(10):
    angle=math.tau*i/10
    x=-.515+.13*math.cos(angle);y=-.693+.047*math.sin(angle)
    ellipsoid('BroadLeaf'+str(i),(x,y,-.562),(.041,.022,.010),light if i%3==0 else green,(0,.18,angle))
normal=Vector((0,-.55,.835)).normalized();a=Vector((1,0,0));b=normal.cross(a).normalized()
orientation=normal.to_track_quat('Z','Y')
positions=[(-.635,-.728,-.536),(-.515,-.735,-.529),(-.395,-.728,-.536),(-.575,-.658,-.528),(-.455,-.658,-.528)]
for flower,pos in enumerate(positions):
    center=Vector(pos)
    for petal in range(5):
        angle=math.tau*petal/5+.3*flower
        direction=a*math.cos(angle)+b*math.sin(angle)
        rotation=orientation.to_matrix()@__import__('mathutils').Matrix.Rotation(angle,3,'Z')
        ellipsoid('Flower%dPetal%d'%(flower,petal),center+direction*.020,(.021,.012,.006),cream,rotation.to_euler())
    ellipsoid('Flower%dCenter'%flower,center+normal*.006,(.010,.010,.007),yellow,orientation.to_euler())
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
for o in created:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'ClothingStore-planter-clean.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'ClothingStore-planter-clean.blend'))
s=bpy.context.scene;s.render.filepath=str(ROOT/'ClothingStore-planter-clean.png');bpy.ops.render.render(write_still=True)
target=Vector((-.52,-.7,-.22));s.camera.location=target+Vector((.12,-2,.4));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=.85;s.render.resolution_x=1200;s.render.resolution_y=1200
s.render.filepath=str(ROOT/'ClothingStore-planter-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'planter-info.json').write_text(json.dumps({'old_vegetation_faces_removed':removed,'flowers':5,'petals_per_flower':5,'new_native_objects':len(created),'window_and_building_preserved_outside_planter_region':True},indent=2))
