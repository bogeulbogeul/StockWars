from pathlib import Path
P=Path(__file__).resolve().parent
source=(P.parent/'somangi-bench-sit-v1/animate.py').read_text()
source=source.replace('def smooth(a,b,t):','rig.animation_data_clear()\nfor previous in list(bpy.data.actions):bpy.data.actions.remove(previous)\ndef smooth(a,b,t):')
source=source.replace('    arm=-9*amount',"    for side,delta in info['seated_leg_offsets'].items():\n        rig.pose.bones['Leg.'+side].location=rig.data.bones['Leg.'+side].matrix_local.to_3x3().inverted()@(Vector(delta)*amount)\n    arm=-9*amount")
source=source.replace('cam.location=(3,-5,2.0)','cam.location=(6,0,.10)')
source=source.replace('cam.data.ortho_scale=4','cam.data.ortho_scale=3.5')
source=source.replace('s.render.resolution_x=640','s.render.resolution_x=480')
source=source.replace("'frames'","'side-frames'")
exec(compile(source,str(P/'animate.py'),'exec'))
