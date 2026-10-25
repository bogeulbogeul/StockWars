import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
rows=[]
for o in bpy.context.scene.objects:
 if o.name.startswith('Roof_') and 'Central_Right' in o.name:
  normals=[list(p.normal) for p in o.data.polygons if p.area>.002]
  rows.append({'name':o.name,'normals':normals})
(ROOT/'normals.json').write_text(json.dumps(rows,indent=2))
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 nodes=mat.node_tree.nodes;out=nodes.get('Material Output')
 if out is None:continue
 emission=nodes.new('ShaderNodeEmission');emission.inputs['Color'].default_value=(.05,.20,.5,1) if mat.name=='Roof_Blue' else (.5,.5,.5,1)
 mat.node_tree.links.new(emission.outputs[0],out.inputs['Surface'])
scene=bpy.context.scene;scene.cycles.samples=4;scene.render.filepath=str(ROOT/'unlit-diagnostic.png')
bpy.ops.render.render(write_still=True)
