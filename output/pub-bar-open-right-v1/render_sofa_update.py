"""Rebuild assets and render the sofa and overall room."""
from pathlib import Path
root=Path(__file__).resolve().parent
source=(root/'build_preview.py').read_text(encoding='utf-8')
source=source.replace('bpy.ops.render.render(write_still=True)',
    "\nif Path(scene.render.filepath).name in {'front.png','sofa-close.png'}: bpy.ops.render.render(write_still=True)")
exec(compile(source,str(root/'build_preview.py'),'exec'))
