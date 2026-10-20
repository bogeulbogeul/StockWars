"""Rebuild all assets, rendering only views affected by a door adjustment."""
from pathlib import Path
root=Path(__file__).resolve().parent
source=(root/'build_preview.py').read_text(encoding='utf-8')
source=source.replace('bpy.ops.render.render(write_still=True)',
    "\nif Path(scene.render.filepath).name in {'front.png','door-close.png'}: bpy.ops.render.render(write_still=True)")
exec(compile(source,str(root/'build_preview.py'),'exec'))
