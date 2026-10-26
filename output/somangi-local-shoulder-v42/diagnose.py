from pathlib import Path
P=Path(__file__).resolve().parent
code=(P/'render.py').read_text()
if '--before' in __import__('sys').argv:
 code=code.replace("P/'somangi-eat.glb'","P.parent/'somangi-continuous-shoulder-v41/somangi-eat.glb'")
code=code.replace("target=Vector((0,-.1,0))","target=Vector((0,0,-.045))")
code=code.replace("(-6,-.1,0)","(-6,0,-.045)")
code=code.replace("ortho_scale=2.55","ortho_scale=.48")
code=code.replace("scene.cycles.samples=12","scene.cycles.samples=32")
code=code.replace("'side-frames' if side else 'frames'","'diagnostic-color' if '--color' in sys.argv else 'close-side'")
if '--before' in __import__('sys').argv:code=code.replace("'close-side'","'close-before'")
if '--opposite' in __import__('sys').argv:
 code=code.replace('(-6,0,-.045)','(6,0,-.045)').replace("'close-side'","'close-right'")
inject="""
if '--color' in sys.argv:
 b=next(o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.vertices)>10000)
 mi=max(f.material_index for f in b.data.polygons);mat=b.data.materials[mi].copy();mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.02,.2,.7,1);b.data.materials[mi]=mat
 for n,colour in [('Arm.L',(.7,.05,.02,1)),('Arm.R',(.7,.05,.02,1))]:
  mat=bpy.data.materials.new(n);mat.diffuse_color=colour;mat.use_nodes=True
  mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=colour
  ix=len(b.data.materials);b.data.materials.append(mat);gi=b.vertex_groups[n].index
  for f in b.data.polygons:
   if all(any(g.group==gi and g.weight>.999 for g in b.data.vertices[v].groups) for v in f.vertices):f.material_index=ix
"""
code=code.replace('scene=bpy.context.scene',inject+'\nscene=bpy.context.scene')
exec(compile(code,str(P/'render.py'),'exec'))
