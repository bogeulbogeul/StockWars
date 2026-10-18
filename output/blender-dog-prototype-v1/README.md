# Procedural dog prototype

Experimental Blender model, separate from the adopted 2D game assets.

- `dog.blend`: editable source; `dog.glb`: static exported model.
- Front, side, back, blink and happy PNGs are actual Blender renders.
- Head and ears share a remeshed surface. The chin has no raised rim.
- Eyes, eyebrows and mouth are texture colors; nose remains geometry.
- In material `Face texture - swap image for expressions`, change the image
  on node `EXPRESSION_IMAGE` to switch neutral / blink / happy.
- Face textures currently include fur and muzzle colors; keep these identical
  when painting more expressions. All variants share the same projected UVs.
- No armature, animation, game integration or final design approval.
- Sculptural proportions and ear silhouette remain a rough prototype.
- Run `build.py` with Blender background Python to reproduce all outputs.
