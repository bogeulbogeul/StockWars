from pathlib import Path
P=Path(__file__).resolve().parent
code=(P.parent/'somangi-story-expressions-v4/build.py').read_text()
code=code.replace('P=Path(__file__).resolve().parent;','P=Path(__file__).resolve().parent/"rebuild";')
code=code.replace("P.parent/'somangi-rear-junction-v43/somangi-eat.blend'","P.parent.parent/'somangi-rear-junction-v43/somangi-eat.blend'")
code=code.replace('from face_styles import STYLES,paint','from face_styles import STYLES,paint\nSTYLES=[s for s in STYLES if s[0]=="teary"]')
code=code.replace('ink,blush,tear,keep_eyes,keep_mouth=paint(points,key)','ink,blush,tear,keep_eyes,keep_mouth=paint(points,key)\n   keep_eyes=True')
code=code.replace('   colour=colour*(1-tear[:,None])+np.array([.48,.73,.82])*tear[:,None]','')
code=code.replace('   colour[keep]=pixels[iy[keep],ix[keep],:3]','''   colour[keep]=pixels[iy[keep],ix[keep],:3]
   brow=ink*(points[:,1]>.415)
   colour=colour*(1-brow[:,None])+.004*brow[:,None]
   visible=tear*(colour.min(axis=1)>.94)
   colour=colour*(1-visible[:,None])+np.array([.48,.73,.82])*visible[:,None]''')
exec(compile(code,str(P/'rebuild_teary.py'),'exec'))
