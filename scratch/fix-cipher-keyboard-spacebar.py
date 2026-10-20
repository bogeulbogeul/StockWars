"""Give the spacebar its own coherent bottom row inside the keyboard case."""
from pathlib import Path
import shutil
root=Path('C:/GitHub/StockWars');out=root/'output/cipher-training-computers-v2';out.mkdir(exist_ok=True)
for file in ['monitor-chart.png','monitor-analysis.png']:
    shutil.copy2(root/'output/cipher-training-computers-v1'/file,out/file)
source=(root/'scratch/build-cipher-computers.py').read_text().replace('cipher-training-computers-v1','cipher-training-computers-v2')
source=source.replace("-.414+row*.058", "-.208-row*.052")
source=source.replace("box('Keyboard_Spacebar',(.30,.035,.009),(-.17,-.448,.032),keys,.003)","""
# Bottom row belongs inside the case, rather than protruding as an extra strip.
box('Keyboard_Spacebar',(.43,.040,.012),(-.14,-.428,.0335),keys,.005)
for x in [-.563,-.499,-.435,.15,.214,.278]:
    box('Keyboard_Modifier_Key',(.051,.040,.012),(x,-.428,.0335),keys,.004)
""")
source += "\ncamera.location=(.65,-1.5,1.4);camera.rotation_euler=(Vector((-.10,-.32,.02))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=1.3\nscene.render.resolution_x=1100;scene.render.resolution_y=700;scene.render.filepath=str(out/'keyboard-detail.png');bpy.ops.render.render(write_still=True)\n"
exec(compile(source,str(root/'scratch/build-cipher-computers.py'),'exec'))
