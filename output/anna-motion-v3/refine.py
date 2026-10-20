from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-motion-v3/build.py')
s=p.read_text(encoding='utf-8-sig').replace('elif z<-.62:','elif z<-.70:').replace('smooth(-.62,-.72,z)','smooth(-.70,-.77,z)')
bake='''# Bake the lowered arm rest pose before small walking rotations, matching GLB linear skinning.
pose(0,False);bpy.context.view_layer.update()
for o in meshes:
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();coords=[v.co.copy() for v in m.vertices];ev.to_mesh_clear()
 for mod in list(o.modifiers):
  if mod.type=='ARMATURE':o.modifiers.remove(mod)
 for v,co in zip(o.data.vertices,coords):v.co=co
bpy.context.view_layer.objects.active=rig;bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
 mod=o.modifiers.new('Anna skin','ARMATURE');mod.object=rig
original={o.name:[tuple(v.co) for v in o.data.vertices] for o in meshes}

'''
s=s.replace('actions={}\n',bake+'actions={}\n')
# Keep rest baking at 60 degrees; subsequent action rotations use the new lowered rest.
s=s.replace("actions={}\nfor name", "baked=True\nactions={}\nfor name")
s=s.replace("rot('Arm.'+side,Quaternion((1,0,0),math.radians(swing))@Quaternion((0,1,0),math.radians(sign*60)))", "rot('Arm.'+side,Quaternion((1,0,0),math.radians(swing))@Quaternion((0,1,0),math.radians(0 if globals().get('baked',False) else sign*60)))")
s=s.replace("'rest_meshes_unchanged':True", "'lowered_arm_rest_baked':True,'rest_meshes_unchanged_during_animation':True")
p.write_text(s,encoding='utf-8')
