"""Rebuild the accepted mat with shallow debossed print shading, preserving v2."""
from pathlib import Path
import runpy
import bpy

root = Path('C:/GitHub/StockWars')
out = root / 'output/cipher-cozy-mat-v3'
out.mkdir(exist_ok=True)
source = (root / 'scratch/build-cipher-cozy-mat.py').read_text()
source = source.replace('cipher-cozy-mat-v2', 'cipher-cozy-mat-v3')
insert = '''
normal_image=bpy.data.images.load(str(out/'mat-inset-normal.png'));normal_image.colorspace_settings.name='Non-Color';normal_image.pack()
normal_texture=paint.node_tree.nodes.new('ShaderNodeTexImage');normal_texture.image=normal_image
normal=paint.node_tree.nodes.new('ShaderNodeNormalMap')
paint.node_tree.links.new(normal_texture.outputs['Color'],normal.inputs['Color'])
paint.node_tree.links.new(normal.outputs['Normal'],paint.node_tree.nodes['Principled BSDF'].inputs['Normal'])
'''
source = source.replace("mesh.materials.append(paint);uv=mesh.uv_layers.new()", insert + "\nmesh.materials.append(paint);uv=mesh.uv_layers.new()")
exec(compile(source, str(out/'build-source.py'), 'exec'))
