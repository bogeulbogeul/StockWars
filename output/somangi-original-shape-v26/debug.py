from pathlib import Path
P=Path(__file__).resolve().parent
code=(P/'render.py').read_text()
code=code.replace("bpy.ops.import_scene.gltf(filepath=str(P/'somangi-eat.glb'))","bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))")
insert="""
body=bpy.data.objects['Somangi_SmoothBody']
for name,color in [('Arm caps',(1,0,0,1)),('Body caps',(0,0,1,1))]:
    mat=bpy.data.materials.new(name);mat.diffuse_color=color;mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=color;body.data.materials.append(mat)
groups={body.vertex_groups['Arm.L'].index,body.vertex_groups['Arm.R'].index}
for poly in list(body.data.polygons)[83332:]:
    isarm=all(any(g.group in groups for g in body.data.vertices[i].groups) for i in poly.vertices)
    poly.material_index=len(body.data.materials)-2 if isarm else len(body.data.materials)-1
"""
code=code.replace('scene=bpy.context.scene','scene=bpy.context.scene\n'+insert)
code=code.replace("('side-frames' if side else 'frames')","'debug-frames'")
code=code.replace("([0,13,23,32] if quick else range(36))","[13]")
exec(compile(code,str(P/'render.py'),'exec'))
